FROM gcr.io/exponentjs/android-tools:latest

WORKDIR /root

# Perform NPM Installs (in a cacheable way)
RUN npm install -g gulp-cli

COPY ./tools/package.json ./tools/package.json
RUN cd ./tools && npm install

COPY ./tools-public/package.json ./tools-public/package.json
RUN cd ./tools-public && npm install

# Copy Exponent
COPY ./__internal__ ./__internal__
COPY ./template-files ./template-files
COPY ./android ./android
COPY ./tools ./tools
COPY ./tools-public ./tools-public
COPY ./cpp ./cpp
COPY ./package.json ./package.json
COPY ./xdlpackfile.tgz ./xdlpackfile.tgz

ENV SHELL_APP_BUILDER 1

RUN cd ./tools-public && npm install --save ../xdlpackfile.tgz
RUN mkdir -p ./android/exponentview/src/main/java/host/exp/exponent/generated/
RUN cd ./tools-public && gulp generate-dynamic-macros --buildConstantsPath ../android/exponentview/src/main/java/host/exp/exponent/generated/ExponentBuildConstants.java --platform android
