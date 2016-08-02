#!/usr/bin/python
from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer
from urlparse import urlparse, parse_qs
import subprocess
import json

PORT_NUMBER = 8080

# set up a JSON response with given code
def send_prepared_response(s, code):
    s.send_response(code)
    s.send_header('Content-type', 'text/json')
    s.end_headers()
    return

# request handler for all paths
class requestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)

        # Validation checks to ensure all of the required params exist
        reqParams = ['vol', 'hl']
        for param in reqParams:
            if param not in qs.keys():
                send_prepared_response(self, 500)
                self.wfile.write(json.dumps({'error': 'Sorry, you sent an invalid request.'}))
                return
        # Check if dataset selected; if not, default to all
        if 'data' not in qs.keys():
            data = 'all'
        else:
            data = qs['data'][0]

        # Set up command to run the R script
        cmd = 'Rscript probability_calculation.R ' + str(qs['vol'][0]) + ' ' + str(qs['hl'][0]) + ' ' + data

        # try running the script
        # on error return a 500 Internal Server Error response
        # on success set response object to the output given from the script
        try:
            response = subprocess.check_output(cmd,  universal_newlines=True, shell=True), "\n\n\n"
        except:
            send_prepared_response(self, 500)
            self.wfile.write(json.dumps({'error': 'Sorry, there was an error in running the R script.'}))
            return

        # if code reaches this point, calculation was successful
        # prepare a 200 OK response
        send_prepared_response(self, 200)

        # send JSON response with probability
        self.wfile.write(json.dumps({'probability': float(response[0])}))


# start server
server = HTTPServer(('localhost', PORT_NUMBER), requestHandler)
print 'Started httpserver on port ' , PORT_NUMBER
server.serve_forever()