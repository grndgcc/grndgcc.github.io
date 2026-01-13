<?php
header('Content-Type: application/json');

// Resimlerin kaydedileceği klasör
$uploadDir = 'uploads/';

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['tokenImage'])) {
    $file = $_FILES['tokenImage'];
    $fileName = 'token_' . uniqid() . '.png';
    $uploadPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        // Hosting URL'sini otomatik oluştur
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $folder = dirname($_SERVER['SCRIPT_NAME']);
        $fullUrl = $protocol . "://" . $host . $folder . '/' . $uploadPath;

        echo json_encode(['url' => $fullUrl]);
    } else {
        echo json_encode(['error' => 'Dosya kaydedilemedi.']);
    }
} else {
    echo json_encode(['error' => 'Veri alınamadı.']);
}
?>