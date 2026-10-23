const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'stack-overflowed.pages.dev';
const KEY = '8904a3a4e1c54be7922b7edc16d2f0dd';
const KEY_LOCATION = `https://stack-overflowed.pages.dev/8904a3a4e1c54be7922b7edc16d2f0dd.txt`;

const urlsFile = path.join(__dirname, 'urls.txt');
let urlList = [];

if (fs.existsSync(urlsFile)) {
    urlList = fs.readFileSync(urlsFile, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

if (urlList.length === 0) {
    console.log('No URLs to ping.');
    return;
}

const payload = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList
});

const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = https.request(options, (res) => {
    console.log(`IndexNow statusCode: ${res.statusCode}`);
});

req.on('error', (error) => {
    console.error('IndexNow Error:', error);
});

req.write(payload);
req.end();
