<?php
header('Content-Type: text/plain');
echo "=== PHP Upload Limits ===\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";
echo "max_input_time: " . ini_get('max_input_time') . "\n";

echo "\n=== Server Information ===\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'N/A') . "\n";
echo "PHP Version: " . phpversion() . "\n";

echo "\n=== Testing File Upload ===\n";
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['testfile'])) {
    if ($_FILES['testfile']['error'] === UPLOAD_ERR_OK) {
        echo "✓ File upload successful!\n";
        echo "File size: " . $_FILES['testfile']['size'] . " bytes\n";
        echo "File name: " . $_FILES['testfile']['name'] . "\n";
    } else {
        echo "✗ File upload failed with error code: " . $_FILES['testfile']['error'] . "\n";
    }
}
?>

<form method="post" enctype="multipart/form-data">
    <input type="file" name="testfile">
    <input type="submit" value="Test Upload">
</form>
