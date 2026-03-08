<?php
session_start();
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Unauthorized";
    exit;
}

header('Content-Type: text/csv');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

// Get filter parameters
$startDate = isset($_GET['start']) ? $_GET['start'] : '';
$endDate = isset($_GET['end']) ? $_GET['end'] : '';
$status = isset($_GET['status']) ? $_GET['status'] : '';

// Create filename based on filters
$filename = 'Inquiries_';
$filename .= $startDate ? date('d-m-Y', strtotime($startDate)) : 'AllStart';
$filename .= '_To_';
$filename .= $endDate ? date('d-m-Y', strtotime($endDate)) : 'AllEnd';
$filename .= '_';
$filename .= $status ? ucwords(str_replace('_', ' ', $status)) : 'AllStatuses';
$filename .= '.csv';

header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');

try {
    require_once __DIR__ . '/../config/db.php';
    
    // Build query with filters
    $query = "SELECT * FROM inquiries WHERE 1=1";
    $params = [];
    
    if ($startDate) {
        $query .= " AND created_at >= :start_date";
        $params[':start_date'] = $startDate . ' 00:00:00';
    }
    
    if ($endDate) {
        $query .= " AND created_at <= :end_date";
        $params[':end_date'] = $endDate . ' 23:59:59';
    }
    
    if ($status) {
        $query .= " AND status = :status";
        $params[':status'] = $status;
    }
    
    $query .= " ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $inquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Write CSV headers
    fputcsv($output, array(
        'ID', 
        'Name', 
        'Company', 
        'Email', 
        'Phone', 
        'Country',
        'Status',
        'Message',
        'Created At'
    ));
    
    foreach ($inquiries as $inquiry) {
        fputcsv($output, array(
            $inquiry['id'],
            csvSafe($inquiry['name']),
            csvSafe($inquiry['company']),
            csvSafe($inquiry['email']),
            csvSafe($inquiry['phone']),
            csvSafe($inquiry['country']),
            ucwords(str_replace('_', ' ', $inquiry['status'])),
            csvSafe($inquiry['message']),
            date('d-m-Y H:i', strtotime($inquiry['created_at']))
        ));
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    fputcsv($output, array('Error', 'Failed to generate report'));
}

fclose($output);
exit;

function csvSafe($value) {
    $text = (string)($value ?? '');
    if (preg_match('/^[=+\-@]/', ltrim($text))) {
        return "'" . $text;
    }
    return $text;
}
?>
