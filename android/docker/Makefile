build-android-tools:
	docker build -t gcr.io/exponentjs/android-tools:latest -f android-tools.Dockerfile .

push-android-tools: build-android-tools
	gcloud docker push gcr.io/exponentjs/android-tools:latest

build-android-base:
	docker build -t gcr.io/exponentjs/android-base:latest -f android-base.Dockerfile ../..

push-android-base: build-android-base
	gcloud docker push gcr.io/exponentjs/android-base:latest

.PHONY: build-android-tools push-android-tools build-android-base push-android-base
