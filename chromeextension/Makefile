####################################
# Build command for Chrome Extension
####################################

.PHONY: help build

help:
	$(info ${HELP_MESSAGE})
	@exit 0

build:
	@echo 'Removing prior build...'
	@rm -f latestBuild.zip
	@echo 'Prior build removed!'
	@echo 'Preparing new extension build..'
	@export INLINE_RUNTIME_CHUNK=false; \
	export GENERATE_SOURCEMAP=false; \
	npm run build
	@echo 'Zipping up build files for upload...'
	@zip -r -X latestBuild.zip build/*
	@echo 'New extension build ready for upload!'
	@exit 0

build-firefox:
	@echo 'Removing prior build...'
	@rm -f latestBuildFirefox.zip
	@echo 'Prior build removed!'
	@echo 'Preparing new extension build..'
	@export INLINE_RUNTIME_CHUNK=false; \
	export GENERATE_SOURCEMAP=false; \
	npm run build
	@rm build/manifest.json
	@mv build/manifest_firefox.json build/manifest.json
	@echo 'Zipping up build files for upload...'
	@cd build && zip -r -X ../latestBuildFirefox.zip ./* && cd ..
	@echo 'New extension build ready for upload!'
	@exit 0

define HELP_MESSAGE

	--- Run this command to prepare the build for upload ---
	$ make build

endef

