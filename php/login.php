<?php
header('Content-Type: application/json');
session_start();

try {
    require_once __DIR__ . '/../config/db.php';
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$inputUsername = trim($_POST['username'] ?? '');
$inputPassword = $_POST['password'] ?? '';

// Validate input
if (empty($inputUsername)) {
    echo json_encode(['success' => false, 'message' => 'Username is required']);
    exit;
}

if (empty($inputPassword)) {
    echo json_encode(['success' => false, 'message' => 'Password is required']);
    exit;
}

// Check admin credentials
$stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
$stmt->execute([$inputUsername]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin && password_verify($inputPassword, $admin['password'])) {
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_username'] = $admin['username'];
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
}
?>
