SRCDIR := src
BUNDLEDIR := bundle
SRCFILES := $(wildcard $(SRCDIR)/*.c)
BUNDLEFILES := $(patsubst $(SRCDIR)/%.js,$(BUNDLEDIR)/%.js,$(SRCFILES))

$(BUNDLEDIR)/%.js : $(SRCDIR)/%.js
	browserify $< -o $@

ALL:	$(BUNDLEFILES) \
	fake

bundle/index.js: src/index.js bundle/ether.js bundle/mtEther.js bundle/meEther.js bundle/common.js bundle/meUtil.js


fake:	bundle/index.js src/style.css
	./set_timestamp.sh
