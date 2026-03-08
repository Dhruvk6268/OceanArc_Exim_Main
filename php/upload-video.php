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
    // Check if uploads directory exists and is writable
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create upload directory. Check permissions.');
        }
    }
    
    if (!is_writable($uploadDir)) {
        throw new Exception('Upload directory is not writable. Check permissions.');
    }

    if (!isset($_FILES['video_file']) || $_FILES['video_file']['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = 'No file uploaded or upload error. ';
        switch ($_FILES['video_file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg .= 'File too large. Server limit: ' . ini_get('upload_max_filesize');
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg .= 'File upload was incomplete.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg .= 'No file was selected.';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errorMsg .= 'Missing temporary folder.';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errorMsg .= 'Failed to write file to disk.';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errorMsg .= 'A PHP extension stopped the file upload.';
                break;
            default:
                $errorMsg .= 'Unknown error code: ' . $_FILES['video_file']['error'];
        }
        throw new Exception($errorMsg);
    }

    // Allowed video types
    $allowedExtensions = ['mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm'];
    $fileExtension = strtolower(pathinfo($_FILES['video_file']['name'], PATHINFO_EXTENSION));

    if (!in_array($fileExtension, $allowedExtensions)) {
        throw new Exception('Invalid file type. Only MP4, MPEG, MOV, AVI, WMV, WEBM allowed.');
    }

    // Create unique filename
    $filename = time() . '_' . uniqid() . '.' . $fileExtension;
    $targetPath = $uploadDir . $filename;

    // Move uploaded file
    if (move_uploaded_file($_FILES['video_file']['tmp_name'], $targetPath)) {
        $response['success'] = true;
        $response['videoPath'] = 'uploads/' . $filename;
        $response['message'] = 'Video uploaded successfully';
    } else {
        throw new Exception('Failed to move uploaded file. Check directory permissions.');
    }

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
exit;
