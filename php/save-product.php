<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$response = ['success' => false];

try {
    require_once __DIR__ . '/../config/db.php';

    $id = isset($_POST['id']) && $_POST['id'] !== '' ? intval($_POST['id']) : null;
    $title = trim($_POST['title'] ?? '');
    $slug = trim($_POST['slug'] ?? ''); // ADDED
    $category = trim($_POST['category'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $specifications = trim($_POST['specifications'] ?? '');
    $content = trim($_POST['content'] ?? '');
    $image = trim($_POST['image'] ?? '');
    $video = trim($_POST['video'] ?? '');

    if (empty($title) || empty($content)) {
        throw new Exception('Title and content are required.');
    }

    // Generate slug from title if not provided
    if (empty($slug)) {
        $slug = generateSlug($title);
    } else {
        $slug = generateSlug($slug); // Clean up user-provided slug
    }

    // Check if slug already exists
    $checkStmt = $pdo->prepare("SELECT id FROM products WHERE slug = ? AND id != ?");
    $checkStmt->execute([$slug, $id ?: 0]);
    if ($checkStmt->fetch()) {
        // If slug exists, append a number
        $counter = 1;
        $originalSlug = $slug;
        while (true) {
            $checkStmt->execute([$slug . '-' . $counter, $id ?: 0]);
            if (!$checkStmt->fetch()) {
                $slug = $originalSlug . '-' . $counter;
                break;
            }
            $counter++;
        }
    }

    if ($id) {
        $stmt = $pdo->prepare("UPDATE products SET title=?, slug=?, category=?, description=?, specifications=?, content=?, image=?, video=? WHERE id=?");
        $success = $stmt->execute([$title, $slug, $category, $description, $specifications, $content, $image, $video, $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO products (title, slug, category, description, specifications, content, image, video, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $success = $stmt->execute([$title, $slug, $category, $description, $specifications, $content, $image, $video]);
    }

    if (!$success) {
        throw new Exception('Failed to save product.');
    }

    $response['success'] = true;
    $response['id'] = $id ?: $pdo->lastInsertId();
    $response['slug'] = $slug;

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
exit;

// Helper function to generate slug
function generateSlug($text) {
    // Replace non-alphanumeric characters with hyphens
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $text);
    // Convert to lowercase and trim hyphens
    $slug = strtolower(trim($slug, '-'));
    // Remove consecutive hyphens
    $slug = preg_replace('/-+/', '-', $slug);
    // Limit length
    if (strlen($slug) > 100) {
        $slug = substr($slug, 0, 100);
        $slug = trim($slug, '-');
    }
    return $slug;
}
?>
