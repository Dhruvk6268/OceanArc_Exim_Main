<?php
header('Content-Type: application/json');
session_start();

if (isset($_SESSION['admin_id'])) {
    echo json_encode(['authenticated' => true]);
} else {
    echo json_encode(['authenticated' => false]);
}
?>