#!/usr/bin/python
from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer
from urlparse import urlparse, parse_qs
import subprocess

PORT_NUMBER = 8080

class requestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        args = str(qs['vol'][0]) + ' ' + str(qs['hl'][0]) + ' ' + str(qs['data'][0])
        cmd = 'Rscript probability_calculation.R ' + args
        response = subprocess.check_output(cmd,  universal_newlines=True, shell=True), "\n\n\n"
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(response[0])

server = HTTPServer(('localhost', PORT_NUMBER), requestHandler)
print 'Started httpserver on port ' , PORT_NUMBER
server.serve_forever()