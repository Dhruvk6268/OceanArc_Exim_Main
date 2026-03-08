<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: public, max-age=60, stale-while-revalidate=300');

try {
    require_once __DIR__ . '/../config/db.php';

    $limit = filter_input(
        INPUT_GET,
        'limit',
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 50]]
    );

    if ($limit) {
        $stmt = $pdo->prepare("SELECT * FROM products ORDER BY created_at DESC LIMIT :limit");
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
    }

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($products);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
exit;
