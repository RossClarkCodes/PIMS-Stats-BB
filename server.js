import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let filePath = '';
    
    // Route handling
    if (req.url === '/' || req.url === '/index.html') {
        filePath = path.join(__dirname, 'pims-stats.html');
    } else if (req.url.startsWith('/stats/')) {
        // Serve files from output directory
        filePath = path.join(__dirname, 'output', req.url.replace('/stats/', ''));
    } else {
        filePath = path.join(__dirname, req.url);
    }
    
    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        // Get file stats
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }
            
            // Handle directories
            if (stats.isDirectory()) {
                if (req.url === '/stats/') {
                    // List files in output directory
                    fs.readdir(filePath, (err, files) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error reading directory');
                            return;
                        }
                        
                        const html = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Blue Bombers Stats Files</title>
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 40px; }
                                    .file { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
                                    .file a { color: #0066cc; text-decoration: none; }
                                    .file a:hover { text-decoration: underline; }
                                    .size { color: #666; font-size: 0.9em; }
                                </style>
                            </head>
                            <body>
                                <h1>Blue Bombers 2025 Stats Files</h1>
                                <p>Generated files from automated stats collection:</p>
                                ${files.map(file => {
                                    const fileStats = fs.statSync(path.join(filePath, file));
                                    const size = (fileStats.size / 1024).toFixed(1);
                                    return `
                                        <div class="file">
                                            <a href="/stats/${file}">${file}</a>
                                            <span class="size">(${size} KB)</span>
                                        </div>
                                    `;
                                }).join('')}
                                <p><a href="/">← Back to Stats Fetcher</a></p>
                            </body>
                            </html>
                        `;
                        
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(html);
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Directory not found');
                }
                return;
            }
            
            // Determine MIME type
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            // Read and serve file
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error reading file');
                    return;
                }
                
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Content-Length': data.length
                });
                res.end(data);
            });
        });
    });
});

server.listen(PORT, () => {
    console.log(`Blue Bombers Stats Server running on http://localhost:${PORT}`);
    console.log(`Stats files available at http://localhost:${PORT}/stats/`);
    console.log(`Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
}); 