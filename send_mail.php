<?php

// Here we get all the information from the fields sent over by the form.


$message = $_POST['message'];

$to = $_POST['to'];

$subject = '';

$headers = 'From: alarm@wattydev.com';




mail($to, $subject, $message) or die('Error sending Mail'); //This method sends the mail.

echo "Your email was sent!"; // success message


?>