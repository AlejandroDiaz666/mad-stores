
ALL:	bundle/index.js         \
	bundle/meEther.js       \
	bundle/common.js        \
	fake

bundle/common.js: src/common.js
	browserify src/common.js -o bundle/common.js

bundle/ether.js: src/ether.js bundle/common.js
	browserify src/ether.js -o bundle/ether.js

bundle/mtEther.js: src/mtEther.js bundle/common.js
	browserify src/mtEther.js -o bundle/mtEther.js

bundle/meEther.js: src/meEther.js bundle/common.js
	browserify src/meEther.js -o bundle/meEther.js

bundle/meUtil.js: src/meUtil.js bundle/common.js
	browserify src/meUtil.js -o bundle/meUtil.js

bundle/index.js: src/index.js bundle/ether.js bundle/mtEther.js bundle/meEther.js bundle/common.js bundle/meUtil.js
	browserify src/index.js -o bundle/index.js

fake:	bundle/index.js src/style.css
	./set_timestamp.sh
