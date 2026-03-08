<?php
session_start();
require_once __DIR__ . '/../config/db.php';

// Function to get user's location from IP
function getLocationFromIP($ip) {
    if ($ip === '127.0.0.1' || $ip === '::1') {
        return ['country' => 'Localhost', 'city' => 'Local'];
    }
    
    try {
        $url = "http://ip-api.com/json/{$ip}?fields=status,country,city";
        $context = stream_context_create([
            'http' => ['timeout' => 2]
        ]);
        $response = @file_get_contents($url, false, $context);
        
        if ($response !== false) {
            $data = json_decode($response, true);
            if ($data && $data['status'] === 'success') {
                return [
                    'country' => $data['country'] ?? 'Unknown',
                    'city' => $data['city'] ?? 'Unknown'
                ];
            }
        }
    } catch (Exception $e) {
        // Silently fail
    }
    
    return ['country' => 'Unknown', 'city' => 'Unknown'];
}

// Function to detect device type
function detectDevice($userAgent) {
    $userAgent = strtolower($userAgent);
    
    if (strpos($userAgent, 'mobile') !== false || strpos($userAgent, 'android') !== false || strpos($userAgent, 'iphone') !== false) {
        return 'mobile';
    } elseif (strpos($userAgent, 'tablet') !== false || strpos($userAgent, 'ipad') !== false) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}

// Function to detect browser
function detectBrowser($userAgent) {
    if (strpos($userAgent, 'Chrome') !== false) return 'Chrome';
    if (strpos($userAgent, 'Firefox') !== false) return 'Firefox';
    if (strpos($userAgent, 'Safari') !== false) return 'Safari';
    if (strpos($userAgent, 'Edge') !== false) return 'Edge';
    if (strpos($userAgent, 'Opera') !== false) return 'Opera';
    if (strpos($userAgent, 'Brave') !== false) return 'Brave';
    return 'Other';
}

// Function to detect OS
function detectOS($userAgent) {
    if (strpos($userAgent, 'Windows') !== false) return 'Windows';
    if (strpos($userAgent, 'Mac OS') !== false) return 'macOS';
    if (strpos($userAgent, 'Linux') !== false) return 'Linux';
    if (strpos($userAgent, 'Android') !== false) return 'Android';
    if (strpos($userAgent, 'iOS') !== false) return 'iOS';
    return 'Unknown';
}

// Main tracking logic
$response = ['success' => false];
header('Content-Type: application/json');

// Check if PDO connection exists
if (!isset($pdo) || !($pdo instanceof PDO)) {
    $response['error'] = 'Database connection not available';
    echo json_encode($response);
    exit;
}

try {
    // Get visitor data
    $session_id = session_id();
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $referrer = $_SERVER['HTTP_REFERER'] ?? '';
    
    // **CRITICAL FIX: Get the actual page URL from Referer header or JavaScript**
    // When called via AJAX, $_SERVER['REQUEST_URI'] will be track-analytics.php
    // We need to get the actual page from Referer header
    $page_url = '/'; // Default to homepage
    
    if (!empty($_SERVER['HTTP_REFERER'])) {
        // Extract just the path from the referrer URL
        $referer_url = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_PATH);
        if ($referer_url) {
            $page_url = $referer_url;
        }
    } elseif (!empty($_POST['page_url'])) {
        // JavaScript can send the page URL via POST
        $page_url = $_POST['page_url'];
    } elseif (!empty($_SERVER['HTTP_X_PAGE_URL'])) {
        // Custom header from JavaScript
        $page_url = $_SERVER['HTTP_X_PAGE_URL'];
    }
    
    // Clean up the page URL
    $page_url = filter_var($page_url, FILTER_SANITIZE_URL);
    if (empty($page_url) || $page_url === '/php/track-analytics.php') {
        $page_url = '/'; // Default to homepage
    }
    
    // Generate a unique user ID (hash of IP + User Agent)
    $user_id = md5($ip_address . $user_agent);
    
    // Get location
    $location = getLocationFromIP($ip_address);
    
    // Detect device and browser
    $device_type = detectDevice($user_agent);
    $browser = detectBrowser($user_agent);
    $os = detectOS($user_agent);
    
    // Check if this is a returning user
    $is_returning = 0;
    $first_visit = date('Y-m-d H:i:s');
    
    $check_sql = "SELECT first_visit FROM website_analytics WHERE user_id = ? ORDER BY visit_start DESC LIMIT 1";
    $check_stmt = $pdo->prepare($check_sql);
    if ($check_stmt->execute([$user_id])) {
        $row = $check_stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $is_returning = 1;
            $first_visit = $row['first_visit'];
        }
    }
    
    // Check if session already exists and is still active (within last 5 minutes)
    $current_time = date('Y-m-d H:i:s');
    $five_minutes_ago = date('Y-m-d H:i:s', strtotime('-5 minutes'));
    
    $existing_sql = "SELECT id, visit_start FROM website_analytics 
                     WHERE session_id = ? 
                     AND last_activity > ? 
                     ORDER BY last_activity DESC LIMIT 1";
    $existing_stmt = $pdo->prepare($existing_sql);
    $existing_stmt->execute([$session_id, $five_minutes_ago]);
    $existing_row = $existing_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing_row) {
        // Update existing session
        $visit_start = $existing_row['visit_start'];
        $duration = time() - strtotime($visit_start);
        
        $update_sql = "UPDATE website_analytics 
                      SET last_activity = ?,
                          page_url = ?,
                          duration_seconds = ?
                      WHERE id = ?";
        $update_stmt = $pdo->prepare($update_sql);
        $update_stmt->execute([$current_time, $page_url, $duration, $existing_row['id']]);
    } else {
        // Insert new session
        $insert_sql = "INSERT INTO website_analytics 
                      (session_id, user_id, ip_address, user_agent, page_url, referrer, 
                       country, city, device_type, browser, os, is_returning, first_visit, 
                       visit_start, last_activity) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $insert_stmt = $pdo->prepare($insert_sql);
        $insert_stmt->execute([
            $session_id,
            $user_id,
            $ip_address,
            $user_agent,
            $page_url,
            $referrer,
            $location['country'],
            $location['city'],
            $device_type,
            $browser,
            $os,
            $is_returning,
            $first_visit,
            $current_time,
            $current_time
        ]);
    }
    
    $response['success'] = true;
    $response['session_id'] = $session_id;
    $response['page_url'] = $page_url;
    
} catch (Exception $e) {
    error_log("Analytics tracking error: " . $e->getMessage());
    $response['error'] = 'Tracking failed: ' . $e->getMessage();
}

echo json_encode($response);
?>
