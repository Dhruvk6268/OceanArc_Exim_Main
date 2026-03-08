<?php
$tmp_file = __DIR__ . "/test.png";   // Put a small PNG here for testing
$webp_file = __DIR__ . "/test.webp";

$cmd = "/usr/bin/cwebp -q 80 " . escapeshellarg($tmp_file) . " -o " . escapeshellarg($webp_file);
exec($cmd . " 2>&1", $output, $return_var);

echo "Command: $cmd<br>";
echo "Return code: $return_var<br>";
echo "Output:<br>" . implode("<br>", $output) . "<br>";

if (file_exists($webp_file)) {
    echo "✅ WebP created successfully: $webp_file";
} else {
    echo "❌ WebP not created.";
}
?>

