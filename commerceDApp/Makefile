
ALL:	bundle/index.js         \
	fake

bundle/index.js: src/index.js
	browserify src/index.js -o bundle/index.js

fake:	bundle/index.js src/style.css
	./set_timestamp.sh
