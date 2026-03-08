<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_POST['filename'])) {
    echo json_encode(['success' => false, 'error' => 'No filename specified']);
    exit;
}

$file = basename($_POST['filename']);
$filePath = __DIR__ . '/../uploads/' . $file;

if (file_exists($filePath)) {
    if (unlink($filePath)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to delete file']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'File not found']);
}
