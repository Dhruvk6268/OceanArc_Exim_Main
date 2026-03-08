<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

$response = ['success' => false, 'message' => ''];

try {
    if (!isset($_POST['imagePath']) || trim($_POST['imagePath']) === '') {
        throw new Exception('Image path is required');
    }

    $imagePath = trim($_POST['imagePath']);
    $postId = isset($_POST['postId']) ? intval($_POST['postId']) : 0;

    // Validate path to prevent directory traversal
    if (strpos($imagePath, '..') !== false) {
        throw new Exception('Invalid image path');
    }

    $filePath = __DIR__ . '/../' . ltrim($imagePath, '/');

    if (!file_exists($filePath)) {
        throw new Exception('Image not found');
    }

    if (!unlink($filePath)) {
        throw new Exception('Failed to delete image file');
    }

    // Update database if postId is provided
    if ($postId > 0) {
        require_once __DIR__ . '/../config/db.php';
        $stmt = $pdo->prepare("UPDATE blog_posts SET image='' WHERE id=?");
        $stmt->execute([$postId]);
    }

    $response['success'] = true;
    $response['message'] = 'Image deleted successfully';
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
