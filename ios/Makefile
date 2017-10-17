ROOT = ../

build-archive:
	gtar -C ${ROOT} \
		-zcf ${OUTPUT} \
		package.json \
		template-files \
		shellAppBase-builds \
		ios \
		tools-public \
		tools

.PHONY: build-archive
