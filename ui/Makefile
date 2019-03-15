SRCDIR := src
HTMSRCDIR := $(SRCDIR)/html
JSSRCDIR  := $(SRCDIR)/js
CSSSRCDIR := $(SRCDIR)/css
IMGSRCDIR := $(SRCDIR)/images
HTMBLDDIR := build/
CSSBLDDIR := build/css
IMGBLDDIR := build/images
JSBLDDIR  := build/bundle
JSSRCFILES := $(wildcard $(JSSRCDIR)/*.js)
IMGSRCFILES := $(wildcard $(IMGSRCDIR)/*.jpg) $(wildcard $(IMGSRCDIR)/*.png)
HTMSRCFILES := $(wildcard $(HTMSRCDIR)/*.html)
CSSSRCFILES := $(wildcard $(CSSSRCDIR)/style.css)
CSSTHEMEFILES := $(wildcard $(CSSSRCDIR)/*-theme.css)
JSBLDFILES := $(patsubst $(JSSRCDIR)/%.js,$(JSBLDDIR)/%.js,$(JSSRCFILES))
IMGBLDFILES := $(patsubst $(IMGSRCDIR)/%,$(IMGBLDDIR)/%,$(IMGSRCFILES))
HTMBLDFILES := $(patsubst $(HTMSRCDIR)/%,$(HTMBLDDIR)/%,$(HTMSRCFILES))
CSSSTYLEFILES := $(patsubst $(CSSSRCDIR)/%-theme.css,$(CSSBLDDIR)/%-style.css,$(CSSTHEMEFILES))
CSSBLDFILES := $(CSSSTYLEFILES)
INDEXALIAS := stores

all:	$(HTMBLDDIR)/index.html

clean:
	rm -rf build/*

deploy: all
	rm -rf release/*
	if [ ! -d release ]; then mkdir release; fi
	mkdir release/css
	mkdir release/images
	mkdir release/bundle
	cp $(HTMBLDDIR)/*.html release/
	cp $(HTMBLDDIR)/*.html $(HTMBLDDIR)/$(INDEXALIAS) release/
	cp $(IMGBLDDIR)/* release/images/
	cp $(CSSBLDDIR)/*_TIMESTAMP*.css release/css/
	cp $(JSBLDDIR)/SVGAnimation.js release/bundle/
	cp $(JSBLDDIR)/index_TIMESTAMP*.js release/bundle/
	tar -czf $(INDEXALIAS)-$(shell cat src/js/autoVersion.txt).tar.gz release

$(CSSBLDDIR)/%-style.css : $(CSSSRCDIR)/%-theme.css $(CSSSRCDIR)/style.css
	if [ ! -d $(CSSBLDDIR) ]; then mkdir -p $(CSSBLDDIR); fi
	cat $< > $@
	cat $(CSSSRCDIR)/style.css >> $@


#
# this can run every time to check the current git version. if it hasn't
# changed since last build then autoVersion.js is not touched; nevertheless,
# autoVersion.js should not be under git, in order to avoid the need to
# recursively re-create, then re-commit it.
#
.PHONEY :
	./autoVersion.sh

$(JSSRCDIR)/autoVersion.js : .PHONEY

$(IMGBLDDIR)/%.jpg : $(IMGSRCDIR)/%.jpg
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(IMGBLDDIR)/%.png : $(IMGSRCDIR)/%.png
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(JSBLDDIR)/%.js : $(JSSRCDIR)/%.js
	if [ ! -d $(JSBLDDIR) ]; then mkdir -p $(JSBLDDIR); fi
	browserify $< -o $@

$(JSBLDDIR)/index.js: $(JSSRCDIR)/index.js $(JSSRCDIR)/autoVersion.js \
	$(JSBLDDIR)/ether.js \
	$(JSBLDDIR)/mtEther.js \
	$(JSBLDDIR)/dhcrypt.js \
	$(JSBLDDIR)/mtUtil.js \
	$(JSBLDDIR)/meEther.js \
	$(JSBLDDIR)/common.js \
	$(JSBLDDIR)/meUtil.js \
	$(JSBLDDIR)/shop.js \
	$(JSBLDDIR)/dashboard.js \
	$(JSBLDDIR)/createStore.js \
	$(JSBLDDIR)/categories.js \
	$(JSBLDDIR)/regions.js

$(HTMBLDDIR)/index.html : $(HTMSRCDIR)/index.html \
	$(CSSBLDFILES) \
	$(IMGBLDFILES) \
	$(JSBLDFILES)
	if [ ! -d $(HTMBLDDIR) ]; then mkdir -p $(HTMBLDDIR); fi
	cp $< $@
	./set_timestamp.sh
	cp $(HTMBLDDIR)/index.html $(HTMBLDDIR)/$(INDEXALIAS)
