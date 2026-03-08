<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../config/db.php';
    
    // Get all GET parameters
    $params = $_GET;
    
    // Remove known parameters first
    unset($params['id']);
    
    // Check for slug as a direct parameter (not as key-value pair)
    $slug = null;
    foreach ($params as $key => $value) {
        // If the key is numeric (like in ?value), it's our slug
        if (is_numeric($key)) {
            $slug = $value;
            break;
        }
        // OR if we have a parameter named 'slug'
        if ($key === 'slug') {
            $slug = $value;
            break;
        }
    }
    
    // Check if we have a direct slug parameter (like ?rice-exporter-india)
    if (!$slug && count($params) > 0) {
        // Get the first parameter value that's not 'id'
        $firstParam = reset($params);
        if ($firstParam) {
            $slug = $firstParam;
        }
    }
    
    // Fallback: check for 'slug' parameter
    if (!$slug && isset($_GET['slug'])) {
        $slug = $_GET['slug'];
    }
    
    // Final fallback: check for ID
    if (!$slug && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$_GET['id']]);
    } else if ($slug) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE slug = ?");
        $stmt->execute([$slug]);
    } else {
        echo json_encode(['error' => 'Product slug or ID is required']);
        exit;
    }
    
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($product) {
        echo json_encode($product);
    } else {
        echo json_encode(['error' => 'Product not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
exit;
?>
