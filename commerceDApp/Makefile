
ALL:	bundle/index.js         \
	fake

bundle/index.js: src/index.js
	browserify src/index.js -o bundle/index.js

fake:	bundle/index.js
	./set_timestamp.sh
