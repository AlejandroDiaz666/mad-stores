SRCDIR := src
BUNDLEDIR := bundle
SRCFILES := $(wildcard $(SRCDIR)/*.js)
BUNDLEFILES := $(patsubst $(SRCDIR)/%.js,$(BUNDLEDIR)/%.js,$(SRCFILES))

$(BUNDLEDIR)/%.js : $(SRCDIR)/%.js
	browserify $< -o $@

ALL:	$(BUNDLEFILES) \
	fake

bundle/index.js: src/index.js bundle/ether.js bundle/mtEther.js bundle/meEther.js bundle/common.js bundle/meUtil.js bundle/createStore.js


fake:	bundle/index.js src/style.css
	./set_timestamp.sh
