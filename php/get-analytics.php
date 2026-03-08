<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    require_once __DIR__ . '/../config/db.php';

    $tableExistsStmt = $pdo->query("SHOW TABLES LIKE 'website_analytics'");
    $tableExists = $tableExistsStmt && $tableExistsStmt->fetchColumn();
    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'error' => 'website_analytics table not found. Import sql/analytics.sql first.'
        ]);
        exit;
    }

    $summarySql = "
        SELECT
            COUNT(*) AS total_views,
            COUNT(DISTINCT user_id) AS unique_users,
            SUM(CASE WHEN last_activity >= (NOW() - INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) AS live_views,
            SUM(CASE WHEN is_returning = 1 THEN 1 ELSE 0 END) AS returning_views
        FROM website_analytics
    ";
    $summaryStmt = $pdo->query($summarySql);
    $summary = $summaryStmt ? $summaryStmt->fetch(PDO::FETCH_ASSOC) : [];

    $recentSql = "
        SELECT page_url, country, city, device_type, browser, os, last_activity, visit_start, duration_seconds, is_returning
        FROM website_analytics
        ORDER BY last_activity DESC
        LIMIT 30
    ";
    $recentStmt = $pdo->query($recentSql);
    $recentLogs = $recentStmt ? $recentStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    $topPagesSql = "
        SELECT page_url, COUNT(*) AS views
        FROM website_analytics
        GROUP BY page_url
        ORDER BY views DESC
        LIMIT 8
    ";
    $topPagesStmt = $pdo->query($topPagesSql);
    $topPages = $topPagesStmt ? $topPagesStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    echo json_encode([
        'success' => true,
        'summary' => [
            'total_views' => (int)($summary['total_views'] ?? 0),
            'unique_users' => (int)($summary['unique_users'] ?? 0),
            'live_views' => (int)($summary['live_views'] ?? 0),
            'returning_views' => (int)($summary['returning_views'] ?? 0),
        ],
        'recent_logs' => $recentLogs,
        'top_pages' => $topPages
    ]);
} catch (Throwable $e) {
    error_log('get-analytics.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load analytics']);
}
?>
