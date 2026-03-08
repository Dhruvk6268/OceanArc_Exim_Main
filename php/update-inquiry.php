<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_POST['id']) || !isset($_POST['status'])) {
    echo json_encode(['success' => false, 'error' => 'ID and status are required']);
    exit;
}

try {
    require_once __DIR__ . '/../config/db.php';
    
    $stmt = $pdo->prepare("UPDATE inquiries SET status = ? WHERE id = ?");
    $success = $stmt->execute([$_POST['status'], $_POST['id']]);
    
    echo json_encode(['success' => $success]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
