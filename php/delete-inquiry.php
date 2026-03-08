<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid inquiry ID']);
        exit;
    }

    require_once __DIR__ . '/../config/db.php';

    $stmt = $pdo->prepare("DELETE FROM inquiries WHERE id = :id");
    $stmt->execute([':id' => $_POST['id']]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Inquiry not found']);
    }
} catch (PDOException $e) {
    error_log("DB Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
