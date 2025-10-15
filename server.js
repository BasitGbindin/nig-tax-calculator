/*
 * Nig Tax Calculator Server
 *
 * This simple Node.js server uses the built‑in `http` and `fs` modules to
 * provide a back end for the Nig Tax Calculator web app. It serves static
 * HTML, CSS and JavaScript files from the `public` directory and exposes
 * endpoints for reading and updating the tax configuration. The configuration
 * values are stored in `config.json` at the project root.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_FILE = path.join(__dirname, 'config.json');

/**
 * Read the tax configuration synchronously.
 *
 * @returns {Object} Parsed JSON object containing tax bands and CIT settings.
 */
function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading config:', err);
    return {};
  }
}

/**
 * Write updated configuration to disk.
 *
 * @param {Object} data New configuration object to persist.
 */
function writeConfig(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Determine content type based on file extension.
 *
 * @param {string} filePath Path to the file.
 * @returns {string} Corresponding MIME type.
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Serve a static file from the public directory.
 *
 * @param {string} filePath Relative path within `PUBLIC_DIR`.
 * @param {http.ServerResponse} res Response object.
 */
function serveStatic(filePath, res) {
  const fullPath = path.join(PUBLIC_DIR, filePath);
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': getContentType(fullPath) });
    res.end(data);
  });
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  // Handle CORS for API endpoints
  if (url.startsWith('/config') || url.startsWith('/update-config')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
  }

  if (req.method === 'GET') {
    if (url === '/config') {
      // Serve configuration as JSON
      const config = readConfig();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(config));
      return;
    }
    // Serve files. Default route serves index.html
    let filePath = url;
    if (filePath === '/' || filePath === '') {
      filePath = '/index.html';
    }
    serveStatic(filePath, res);
  } else if (req.method === 'POST' && url === '/update-config') {
    // Update configuration
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        writeConfig(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        console.error('Failed to update config:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.log(`Nig Tax Calculator server running on http://localhost:${PORT}`);
});
