#!/usr/bin/env python3
"""
Simple HTTP server for local development
Run this script and then open http://localhost:8000 in your browser
"""
import http.server
import socketserver
import os

PORT = 8000

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

Handler = MyHttpRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server started at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()