# Makefile for Sphinx documentation
#

# You can set these variables from the command line.
DEFAULT_VERSION ?= v10.0.0
SPHINXBUILD   = sphinx-build
BUILDDIR      = _build
export PYGMENTS_NODE_COMMAND = node

# User-friendly check for sphinx-build
ifeq ($(shell which $(SPHINXBUILD) >/dev/null 2>&1; echo $$?), 1)
	$(error The '$(SPHINXBUILD)' command was not found. Make sure you have Sphinx installed, then set the SPHINXBUILD environment variable to point to the full path of the '$(SPHINXBUILD)' executable. Alternatively you can add the directory with the executable to your PATH. If you don\'t have Sphinx installed, grab it from http://sphinx-doc.org/)
endif

.PHONY: clean deploy
clean:
	rm -rf $(BUILDDIR)/*

# redirect:
# 	mkdir -p _build/html
# 	sed -e 's/REPLACE_ME/$(DEFAULT_VERSION)/g' index-template.html > _build/html/index.html

update-exp-json-guide:
	DOCS_VERSION=$(DEFAULT_VERSION) node scripts/generate-exp-docs.js versions/$(DEFAULT_VERSION)/guides/configuration.rst

serve: clean update-exp-json-guide
	DOCS_VERSION=$(DEFAULT_VERSION) sphinx-autobuild --host 0.0.0.0 . _build/html

version/%:
	DOCS_VERSION=$(@F) $(SPHINXBUILD) . -d $(BUILDDIR)/doctrees/$(@F) -b html $(BUILDDIR)/html
	@echo
	@echo "Build finished. The HTML pages are in $(BUILDDIR)/html."
	@echo "The start page for version '$(@F)' is $(BUILDDIR)/html/versions/$(@F)/index.html."

deploy:
	DOCS_VERSION=$(DEFAULT_VERSION) ./scripts/deploy.sh

all: $(subst versions/,version/,$(sort $(wildcard versions/*)))
