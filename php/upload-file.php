<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'File upload error']);
    exit;
}

// 100MB max
$maxSize = 100 * 1024 * 1024;
if ($_FILES['file']['size'] > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'File too large']);
    exit;
}

$allowedExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm',
    'pdf', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar'
];

$allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-rar-compressed'
];

$fileExtension = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
$fileMime = mime_content_type($_FILES['file']['tmp_name']);
if (!in_array($fileExtension, $allowedExtensions, true) || !in_array($fileMime, $allowedMimeTypes, true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
    echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
    exit;
}

$safeBaseName = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES['file']['name']));
$filename = time() . '_' . $safeBaseName;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
    echo json_encode(['success' => true, 'filename' => $filename]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
}
