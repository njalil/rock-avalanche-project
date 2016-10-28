#!/bin/bash
# echo killing
# for k in $(ps ax | grep python) ; do
#     kill $(cut -d ' '  -f 6)
#     kill $(cut -d ' '  -f 5) 
# done
echo running

cd www

python -m SimpleHTTPServer 8080 &

cd ..

PATH=$PATH:/cygdrive/c/Program\ Files/R/R-3.3.1/bin/

echo $PATH

python probability_calculation.py &

echo done.
