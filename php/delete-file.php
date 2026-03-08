<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_POST['filePath'])) {
    echo json_encode(['success' => false, 'error' => 'File path is required']);
    exit;
}

try {
    $filePath = $_POST['filePath'];
    $fullPath = __DIR__ . '/..' . (strpos($filePath, '/') === 0 ? '' : '/') . $filePath;
    
    if (file_exists($fullPath)) {
        if (unlink($fullPath)) {
            echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete file from server']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'File not found on server']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
}
exit;
