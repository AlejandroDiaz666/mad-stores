SRCDIR := src
BUNDLEDIR := bundle
SRCFILES := $(wildcard $(SRCDIR)/*.js)
BUNDLEFILES := $(patsubst $(SRCDIR)/%.js,$(BUNDLEDIR)/%.js,$(SRCFILES))

$(BUNDLEDIR)/%.js : $(SRCDIR)/%.js
	browserify $< -o $@

ALL:	$(BUNDLEFILES) \
	fake

bundle/index.js: src/index.js bundle/ether.js bundle/mtEther.js bundle/meEther.js \
	bundle/common.js bundle/meUtil.js bundle/shop.js bundle/createStore.js \
	bundle/categories.js bundle/regions.js


fake:	bundle/index.js src/style.css
	./set_timestamp.sh
