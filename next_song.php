<?php
function random_pic($dir = 'music') {
    $files = glob($dir . '/*.mp3');
    $file = array_rand($files);
    return $files[$file];
}
$next_song = random_pic();
echo json_encode($next_song);