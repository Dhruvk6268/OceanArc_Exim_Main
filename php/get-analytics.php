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

    $startDate = trim($_GET['start_date'] ?? '');
    $endDate = trim($_GET['end_date'] ?? '');
    $searchPage = trim($_GET['search_page'] ?? '');
    $searchUserId = trim($_GET['search_user_id'] ?? '');
    $searchPage = substr($searchPage, 0, 200);
    $searchUserId = substr($searchUserId, 0, 64);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = (int)($_GET['limit'] ?? 20);
    if ($limit < 1) {
        $limit = 20;
    }
    if ($limit > 100) {
        $limit = 100;
    }
    $offset = ($page - 1) * $limit;

    $whereClauses = [];
    $params = [];

    if ($startDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
        $whereClauses[] = "visit_start >= :start_datetime";
        $params[':start_datetime'] = $startDate . ' 00:00:00';
    }

    if ($endDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
        $whereClauses[] = "visit_start <= :end_datetime";
        $params[':end_datetime'] = $endDate . ' 23:59:59';
    }

    if ($searchPage !== '') {
        $whereClauses[] = "page_url LIKE :search_page";
        $params[':search_page'] = '%' . $searchPage . '%';
    }

    if ($searchUserId !== '') {
        $whereClauses[] = "user_id LIKE :search_user_id";
        $params[':search_user_id'] = '%' . $searchUserId . '%';
    }

    $whereSql = '';
    if (!empty($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }

    $summarySql = "
        SELECT
            COUNT(*) AS total_views,
            COUNT(DISTINCT user_id) AS unique_users,
            SUM(CASE WHEN is_returning = 1 THEN 1 ELSE 0 END) AS returning_views
        FROM website_analytics
        {$whereSql}
    ";
    $summaryStmt = $pdo->prepare($summarySql);
    $summaryStmt->execute($params);
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $liveWhereClauses = $whereClauses;
    $liveWhereClauses[] = "last_activity >= (NOW() - INTERVAL 5 MINUTE)";
    $liveWhereSql = ' WHERE ' . implode(' AND ', $liveWhereClauses);
    $liveSql = "SELECT COUNT(*) FROM website_analytics {$liveWhereSql}";
    $liveStmt = $pdo->prepare($liveSql);
    $liveStmt->execute($params);
    $liveViews = (int)$liveStmt->fetchColumn();

    $countSql = "SELECT COUNT(*) FROM website_analytics {$whereSql}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalLogs = (int)$countStmt->fetchColumn();

    $recentSql = "
        SELECT user_id, page_url, country, city, device_type, browser, os, last_activity, visit_start, duration_seconds, is_returning
        FROM website_analytics
        {$whereSql}
        ORDER BY last_activity DESC
        LIMIT {$limit} OFFSET {$offset}
    ";
    $recentStmt = $pdo->prepare($recentSql);
    $recentStmt->execute($params);
    $recentLogs = $recentStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $topPagesSql = "
        SELECT page_url, COUNT(*) AS views
        FROM website_analytics
        {$whereSql}
        GROUP BY page_url
        ORDER BY views DESC
        LIMIT 8
    ";
    $topPagesStmt = $pdo->prepare($topPagesSql);
    $topPagesStmt->execute($params);
    $topPages = $topPagesStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $hasMore = ($offset + count($recentLogs)) < $totalLogs;

    echo json_encode([
        'success' => true,
        'summary' => [
            'total_views' => (int)($summary['total_views'] ?? 0),
            'unique_users' => (int)($summary['unique_users'] ?? 0),
            'live_views' => $liveViews,
            'returning_views' => (int)($summary['returning_views'] ?? 0),
        ],
        'recent_logs' => $recentLogs,
        'top_pages' => $topPages,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalLogs,
            'has_more' => $hasMore
        ],
        'filters' => [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'search_page' => $searchPage,
            'search_user_id' => $searchUserId
        ]
    ]);
} catch (Throwable $e) {
    error_log('get-analytics.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load analytics']);
}
?>
