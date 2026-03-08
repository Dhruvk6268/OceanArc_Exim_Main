<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
$filesList = [];

if (is_dir($uploadDir)) {
    foreach (array_diff(scandir($uploadDir), ['.', '..']) as $file) {
        $filePath = $uploadDir . $file;
        if (is_file($filePath)) {
            $filesList[] = [
                'name' => $file,
                'size' => filesize($filePath), // in bytes
                'date' => date("Y-m-d H:i:s", filemtime($filePath)),
                'time' => filemtime($filePath)
            ];
        }
    }
}

usort($filesList, function($a, $b) {
    return $b['time'] - $a['time'];
});

$filesList = array_map(function($file) {
    unset($file['time']);
    return $file;
}, $filesList);

echo json_encode($filesList);
