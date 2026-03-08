<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_POST['id']) || !isset($_POST['assignee'])) {
    echo json_encode(['success' => false, 'error' => 'ID and assignee are required']);
    exit;
}

try {
    require_once __DIR__ . '/../config/db.php';
    
    $stmt = $pdo->prepare("UPDATE inquiries SET assigned_to = ? WHERE id = ?");
    $success = $stmt->execute([$_POST['assignee'], $_POST['id']]);
    
    echo json_encode(['success' => $success]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
