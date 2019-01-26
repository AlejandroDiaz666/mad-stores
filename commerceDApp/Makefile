SRCDIR := src
CSSSRCDIR := $(SRCDIR)
IMGSRCDIR := images
HTMSRCDIR := .
HTMBLDDIR := build
CSSBLDDIR := build/css
IMGBLDDIR := build/images
BUNDLEDIR := build/bundle
JSSRCFILES := $(wildcard $(SRCDIR)/*.js)
IMGSRCFILES := $(wildcard $(IMGSRCDIR)/*.jpg) $(wildcard $(IMGSRCDIR)/*.png)
HTMSRCFILES := $(wildcard $(HTMSRCDIR)/*.html)
CSSSRCFILES := $(wildcard $(CSSSRCDIR)/*.css)
BUNDLEFILES := $(patsubst $(SRCDIR)/%.js,$(BUNDLEDIR)/%.js,$(JSSRCFILES))
IMGBLDFILES := $(patsubst $(IMGSRCDIR)/%,$(IMGBLDDIR)/%,$(IMGSRCFILES))
CSSBLDFILES := $(patsubst $(CSSSRCDIR)/%,$(CSSBLDDIR)/%,$(CSSSRCFILES))


all:	$(HTMBLDDIR)/index.html

clean:
	rm -rf build/*

deploy: all
	rm -rf mes/*
	if [ ! -d mes ]; then mkdir mes; fi
	mkdir mes/css
	mkdir mes/images
	mkdir mes/bundle
	cp $(HTMBLDDIR)/*.html mes/
	cp $(IMGBLDDIR)/* mes/images/
	cp $(CSSBLDDIR)/*_TIMESTAMP*.css mes/css/
	cp $(BUNDLEDIR)/index_TIMESTAMP*.js mes/bundle/
	tar -czf mes-$(shell cat src/autoVersion.txt).tar.gz mes

$(CSSBLDDIR)/style.css : $(CSSSRCDIR)/style.css
	if [ ! -d $(CSSBLDDIR) ]; then mkdir -p $(CSSBLDDIR); fi
	cp $< $@

$(IMGBLDDIR)/%.jpg : $(IMGSRCDIR)/%.jpg
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(IMGBLDDIR)/%.png : $(IMGSRCDIR)/%.png
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

#
# this can run every time to check the current git version. if it hasn't
# changed since last build then autoVersion.js is not touched; nevertheless,
# autoVersion.js should not be under git, in order to avoid the need to
# recursively re-create, then re-commit it.
#
.PHONEY :
	./autoVersion.sh

$(SRCDIR)/autoVersion.js : .PHONEY

$(BUNDLEDIR)/%.js : $(SRCDIR)/%.js
	browserify $< -o $@

$(BUNDLEDIR)/index.js: $(SRCDIR)/index.js $(SRCDIR)/autoVersion.js \
	$(BUNDLEDIR)/ether.js \
	$(BUNDLEDIR)/mtEther.js \
	$(BUNDLEDIR)/mtUtil.js \
	$(BUNDLEDIR)/dhcrypt.js \
	$(BUNDLEDIR)/meEther.js \
	$(BUNDLEDIR)/common.js \
	$(BUNDLEDIR)/meUtil.js \
	$(BUNDLEDIR)/shop.js \
	$(BUNDLEDIR)/dashboard.js \
	$(BUNDLEDIR)/createStore.js \
	$(BUNDLEDIR)/categories.js \
	$(BUNDLEDIR)/regions.js

$(HTMBLDDIR)/index.html : $(HTMSRCDIR)/index.html \
	$(CSSBLDFILES) \
	$(IMGBLDFILES) \
	$(BUNDLEFILES)
	cp $< $@
	./set_timestamp.sh
