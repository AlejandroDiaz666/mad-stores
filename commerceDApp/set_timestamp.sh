#!/bin/bash
now=$(date +%s)
for f in *.html; do
    sed -i "s/_TIMESTAMP_[^_]*_/_TIMESTAMP_${now}_/" $f
done
rm -f bundle/*_TIMESTAMP_*
for f in bundle/*.js; do
    g=$(echo $f | sed "s/bundle\/\([^\.]*\)\.js/bundle\/\1_TIMESTAMP_${now}_\.js/")
    cp $f $g
done
if [ ! -d css ]; then
    mkdir css
fi
for f in *.css; do
    g=$(echo $f | sed "s/\([^\.]*\)\.css/css\/\1_TIMESTAMP_${now}_\.css/")
    cp $f $g
done
