<?php
/**
 * Junior's Chimney — PHP fallback mail handler.
 *
 * ONLY needed if the site is hosted somewhere that runs PHP (GoDaddy, Bluehost,
 * SiteGround, cPanel hosts...). If you are on Netlify / Cloudflare Pages /
 * GitHub Pages, delete this file and use the Web3Forms key instead — see README.
 *
 * To use it:
 *   1. Set $TO below to Junior's real inbox.
 *   2. In src/pages/contact.html change the form's action to "send.php" and
 *      remove the access_key hidden input, then re-run `python3 build.py`.
 */

declare(strict_types=1);

$TO      = 'info@juniorschimney.com';        // <-- Junior's real inbox
$SUBJECT = 'New website request — Junior\'s Chimney';
$SUCCESS = '/thank-you.html';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed.');
}

/* Honeypot: bots fill hidden fields, humans never see them. */
if (!empty($_POST['botcheck'])) {
    header('Location: ' . $SUCCESS, true, 303);
    exit;
}

function field(string $key, int $max = 2000): string
{
    $raw = $_POST[$key] ?? '';
    if (is_array($raw)) {
        $raw = implode(', ', $raw);
    }
    $raw = substr(trim((string) $raw), 0, $max);
    // Strip anything that could be used to inject extra mail headers.
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], ' ', $raw));
}

$name    = field('name', 120);
$phone   = field('phone', 40);
$email   = field('email', 160);
$address = field('address', 240);
$service = field('services', 300);
$timing  = field('timing', 80);
$type    = field('property', 80);
$message = substr(trim((string) ($_POST['message'] ?? '')), 0, 4000);
$message = str_replace(["\r\n", "\r"], "\n", $message);

$errors = [];
if ($name === '')                                           { $errors[] = 'name'; }
if (strlen(preg_replace('/\D/', '', $phone) ?? '') < 10)     { $errors[] = 'phone'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))              { $errors[] = 'email'; }
if ($address === '')                                        { $errors[] = 'address'; }

if ($errors) {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please check: ' . implode(', ', $errors)]);
    exit;
}

$body = <<<TXT
New request from juniorschimney.com

Name .............. {$name}
Phone ............. {$phone}
Email ............. {$email}
Property address .. {$address}
Services .......... {$service}
Timing ............ {$timing}
Property type ..... {$type}

Message
-------
{$message}

--
Sent {$_SERVER['REQUEST_TIME']} from {$_SERVER['REMOTE_ADDR']}
TXT;

$headers = [
    'From: Junior\'s Chimney Website <no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'juniorschimney.com') . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($TO, $SUBJECT . ' — ' . $name, $body, implode("\r\n", $headers));

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

if ($wantsJson) {
    header('Content-Type: application/json');
    http_response_code($sent ? 200 : 500);
    echo json_encode(['success' => $sent]);
    exit;
}

if ($sent) {
    header('Location: ' . $SUCCESS, true, 303);
    exit;
}

http_response_code(500);
echo 'Sorry — that did not send. Please call (215) 526-3574.';
