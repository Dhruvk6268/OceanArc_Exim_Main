<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$response = ['success' => false];

try {
    if (!isset($_FILES['image_file']) || $_FILES['image_file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }

    // Allowed MIME types and extensions
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // Get real file MIME type
    $fileTmpPath = $_FILES['image_file']['tmp_name'];
    $fileType = mime_content_type($fileTmpPath);
    $fileExtension = strtolower(pathinfo($_FILES['image_file']['name'], PATHINFO_EXTENSION));

    if (!in_array($fileType, $allowedTypes) || !in_array($fileExtension, $allowedExtensions)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and WEBP allowed.');
    }

    // Upload directory
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
        throw new Exception('Failed to create upload directory');
    }

    // Create unique filename
    $filename = time() . '_' . uniqid() . '.' . $fileExtension;
    $targetPath = $uploadDir . $filename;

    // Move file
    if (!move_uploaded_file($fileTmpPath, $targetPath)) {
        throw new Exception('Failed to save uploaded file');
    }

    $response['success'] = true;
    $response['imagePath'] = 'uploads/' . $filename;

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
exit;

