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


$(CSSBLDDIR)/style.css : $(CSSSRCDIR)/style.css
	if [ ! -d $(CSSBLDDIR) ]; then mkdir -p $(CSSBLDDIR); fi
	cp $< $@

$(IMGBLDDIR)/%.jpg : $(IMGSRCDIR)/%.jpg
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(IMGBLDDIR)/%.png : $(IMGSRCDIR)/%.png
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(BUNDLEDIR)/%.js : $(SRCDIR)/%.js
	browserify $< -o $@

$(BUNDLEDIR)/index.js: $(SRCDIR)/index.js \
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
