
ALL:	bundle/index.js         \
	bundle/meEther.js       \
	bundle/common.js        \
	fake

bundle/common.js: src/common.js
	browserify src/common.js -o bundle/common.js

bundle/meEther.js: src/meEther.js bundle/common.js
	browserify src/meEther.js -o bundle/meEther.js

bundle/index.js: src/index.js bundle/meEther.js bundle/common.js
	browserify src/index.js -o bundle/index.js

fake:	bundle/index.js src/style.css
	./set_timestamp.sh
