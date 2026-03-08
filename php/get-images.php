<?php
header('Content-Type: application/json');

$imagesDir = __DIR__ . '/../images/';
$baseUrl = '../images/';
$files = [];

if (is_dir($imagesDir)) {
    foreach (scandir($imagesDir) as $file) {
        if ($file !== '.' && $file !== '..' && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) {
            $filePath = $imagesDir . $file;
            $files[] = [
                'name' => $file,
                'url' => $baseUrl . $file,
                'size' => round(filesize($filePath) / 1024, 2) . ' KB',
                'date' => date("Y-m-d H:i:s", filemtime($filePath))
            ];
        }
    }
}

echo json_encode($files);

