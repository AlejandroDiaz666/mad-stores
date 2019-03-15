#!/bin/bash

#
# this little utility creates a teensy module to get the
# version of the currently building code from git. the module
# will be src/autoVersion.js, which should be in .gitignore
#
BRANCH=$(git branch | grep "*" | cut -d " " -f 2)
VER=$(git describe --tags --long)
current=""
if [ -e src/autoVersion.txt ]; then
    current=$(cat src/autoVersion.txt)
fi
if [ "${current}" != "${BRANCH}-${VER}" ]; then
    echo "autoversion.sh: new version is ${BRANCH}-${VER}"
    echo "autoversion.sh: run make again..."
    echo "${BRANCH}-${VER}" > src/autoVersion.txt
    echo "var autoVersion = module.exports = { version() { return \"$BRANCH $VER\"; } }" > src/autoVersion.js
else
    echo "autoversion.sh: version is unchanged"
fi
