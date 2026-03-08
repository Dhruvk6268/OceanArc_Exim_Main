<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'ID parameter is required']);
    exit;
}

try {
    require_once __DIR__ . '/../config/db.php';
    
    $stmt = $pdo->prepare("SELECT * FROM inquiries WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $inquiry = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($inquiry) {
        echo json_encode($inquiry);
    } else {
        echo json_encode(['error' => 'Inquiry not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
