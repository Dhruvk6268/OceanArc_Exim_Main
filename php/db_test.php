<?php
try {
    require_once __DIR__ . '/../config/db.php';
    echo "Database connection successful!";
    $pdo = null;
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
