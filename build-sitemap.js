
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://stack-overflowed.pages.dev';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const URLS_FILE = path.join(ROOT, 'urls.txt');
const SITEMAP_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');
const REDIRECTS_FILE = path.join(PUBLIC_DIR, '_redirects');

function normalizeUrl(value) {
  const input = value.trim();
  if (!input) return null;

  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`Invalid URL in urls.txt: ${input}`);
  }

  if (parsed.origin !== DOMAIN) {
    throw new Error(`Unexpected domain in urls.txt: ${input}`);
  }

  parsed.pathname =
    '/' + parsed.pathname.split('/').filter(Boolean).join('/');

  if (parsed.pathname === '/') {
    parsed.pathname = '/';
  }

  return parsed.href;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  if (!fs.existsSync(REDIRECTS_FILE)) {
    throw new Error(
      'STOP: public/_redirects is missing. Deployment must not proceed.'
    );
  }

  const redirectText = fs.readFileSync(REDIRECTS_FILE, 'utf8');

  const rules = redirectText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  if (rules.length === 0 || rules.length > 2000) {
    throw new Error(`Invalid static redirect count: ${rules.length}`);
  }

  if (!fs.existsSync(URLS_FILE)) {
    throw new Error('STOP: urls.txt is missing.');
  }

  const inputUrls = fs.readFileSync(URLS_FILE, 'utf8')
    .split(/\r?\n/)
    .map(normalizeUrl)
    .filter(Boolean);

  const urls = [...new Set(inputUrls)];

  if (urls.length === 0) {
    throw new Error('STOP: urls.txt contains no valid URLs.');
  }

  const entries = urls.map(url =>
    `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`
  );

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  const tempFile = SITEMAP_FILE + '.tmp';

  fs.writeFileSync(tempFile, xml, 'utf8');
  fs.renameSync(tempFile, SITEMAP_FILE);

  if (!fs.existsSync(REDIRECTS_FILE)) {
    throw new Error('STOP: Redirect file is missing after sitemap generation.');
  }

  console.log(`Sitemap generated with ${urls.length} URLs.`);
  console.log(`Redirect rules preserved: ${rules.length}`);
  console.log(`Output: ${SITEMAP_FILE}`);
}

main();
