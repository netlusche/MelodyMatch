<?php
/**
 * iTunes API CORS Proxy for MelodyMatch
 * 
 * This file acts as a secure, local server-side proxy to bypass CORS restrictions
 * and iOS Safari Universal Link/JSONP blocks. It only proxies requests to
 * the official iTunes Search API.
 */

// Allow CORS from any origin (or customize to match your domain)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// Get the query parameters passed to this script
$queryString = $_SERVER['QUERY_STRING'];
$url = "https://itunes.apple.com/search";
if (!empty($queryString)) {
    $url .= "?" . $queryString;
}

// Fetch content using cURL if available, otherwise file_get_contents
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // Use a desktop User Agent to prevent Apple from intercepting and redirecting to Apple Music on iOS devices
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200 && $response !== false) {
        echo $response;
        exit;
    }
}

// Fallback to file_get_contents if cURL is disabled
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n",
        "timeout" => 10
    ]
];
$context = stream_context_create($opts);
$response = @file_get_contents($url, false, $context);

if ($response !== false) {
    echo $response;
} else {
    http_response_code(502);
    echo json_encode([
        "error" => "Failed to fetch from iTunes Search API.",
        "details" => "Ensure your web server has outgoing HTTP connections enabled."
    ]);
}
?>
