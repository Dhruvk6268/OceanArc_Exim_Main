<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_POST['id'])) {
    echo json_encode(['success' => false, 'error' => 'ID parameter is required']);
    exit;
}

try {
    require_once __DIR__ . '/../config/db.php';
    
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $success = $stmt->execute([$_POST['id']]);
    
    echo json_encode(['success' => $success]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
exit;
