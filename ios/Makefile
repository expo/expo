ROOT = ../

build-archive:
	gtar -C ${ROOT} \
		-zcfh ${OUTPUT} \
		package.json \
		template-files \
		shellAppBase-builds \
		ios \
		tools-public \
		tools

.PHONY: build-archive
