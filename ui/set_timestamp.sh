#!/bin/bash
now=$(date +%s)
for f in build/*.html; do
    sed -i "s/_TIMESTAMP_[^_]*_/_TIMESTAMP_${now}_/" $f
done
rm -f build/bundle/*_TIMESTAMP_*
for f in build/bundle/*.js; do
    g=$(echo $f | sed "s/bundle\/\([^\.]*\)\.js/bundle\/\1_TIMESTAMP_${now}_\.js/")
    cp $f $g
done
rm -f build/css/*_TIMESTAMP_*
for f in build/css/*.css; do
    g=$(echo $f | sed "s/css\/\([^\.]*\)\.css/css\/\1_TIMESTAMP_${now}_\.css/")
    cp $f $g
done
echo "build date: ${now}" >build/build-date
