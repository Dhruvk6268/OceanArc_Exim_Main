<?php
header('Content-Type: application/json');

// Test script to check PHP configuration and file upload issues
$response = [
    'success' => true,
    'php_version' => PHP_VERSION,
    'max_file_uploads' => ini_get('max_file_uploads'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'memory_limit' => ini_get('memory_limit'),
    'upload_dir_exists' => is_dir(__DIR__ . '/../uploads'),
    'upload_dir_writable' => is_writable(__DIR__ . '/../uploads'),
    'temp_dir_writable' => is_writable(ini_get('upload_tmp_dir') ?: sys_get_temp_dir())
];

// Test database connection
try {
    require_once __DIR__ . '/../config/db.php';
    $response['database_connected'] = true;
    $response['database_driver'] = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
} catch (Exception $e) {
    $response['database_connected'] = false;
    $response['database_error'] = $e->getMessage();
}

echo json_encode($response);
?>
