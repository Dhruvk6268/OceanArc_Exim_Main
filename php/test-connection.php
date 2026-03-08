<?php
require_once '../config/db.php';

header('Content-Type: application/json');

// Use the global $pdo variable
global $pdo;

try {
    // Test if table exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'accounting_transactions'")->rowCount() > 0;
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'table_exists' => $tableExists,
        'database' => $pdo->query('SELECT DATABASE()')->fetchColumn()
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
}
?>
