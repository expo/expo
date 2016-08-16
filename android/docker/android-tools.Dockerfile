# based on https://registry.hub.docker.com/u/samtstern/android-sdk/dockerfile/ with openjdk-8
FROM java:8

MAINTAINER Adam Miskiewicz <skevy@exponentjs.com>

ENV DEBIAN_FRONTEND noninteractive

# Install dependencies
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -yq \
      libc6:i386\
      libstdc++6:i386\
      lib32z1\
      lib32ncurses5\
      bzip2:i386\
      zlib1g:i386\
      libncurses5:i386\
      unzip\
      ant\
      build-essential\

      --no-install-recommends && \
    apt-get clean

# install nodejs
# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 6.2.1

RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt

# Download and untar SDK
ENV ANDROID_SDK_URL http://dl.google.com/android/android-sdk_r24.4.1-linux.tgz
RUN curl -L "${ANDROID_SDK_URL}" | tar --no-same-owner -xz -C /usr/local
ENV ANDROID_HOME /usr/local/android-sdk-linux
ENV ANDROID_SDK /usr/local/android-sdk-linux
ENV PATH ${ANDROID_HOME}/tools:/usr/local/android-sdk-linux/build-tools/23.0.3/:$ANDROID_HOME/platform-tools:$PATH

# Install Android SDK components
# License Id: android-sdk-license-ed0d0a5b
ENV ANDROID_COMPONENTS platform-tools,build-tools-23.0.1,build-tools-23.0.2,build-tools-23.0.3,android-23
# License Id: android-sdk-license-5be876d5
ENV GOOGLE_COMPONENTS extra-android-m2repository,extra-google-m2repository

RUN echo y | android update sdk --no-ui --all --filter "${ANDROID_COMPONENTS}" ; \
    echo y | android update sdk --no-ui --all --filter "${GOOGLE_COMPONENTS}"

# Install Android NDK
ENV ANDROID_NDK_URL http://dl.google.com/android/ndk/android-ndk-r10e-linux-x86_64.bin
RUN wget $ANDROID_NDK_URL
RUN chmod a+x android-ndk-r10e-linux-x86_64.bin && ./android-ndk-r10e-linux-x86_64.bin && mv ./android-ndk-r10e /usr/local/android-ndk-r10e
RUN cp -R /usr/local/android-ndk-r10e/toolchains/arm-linux-androideabi-4.8/prebuilt/linux-x86_64 /usr/local/android-ndk-r10e/toolchains/arm-linux-androideabi-4.8/prebuilt/linux-x86
RUN cp -R /usr/local/android-ndk-r10e/toolchains/x86-4.8/prebuilt/linux-x86_64 /usr/local/android-ndk-r10e/toolchains/x86-4.8/prebuilt/linux-x86
ENV ANDROID_NDK /usr/local/android-ndk-r10e
ENV PATH ${ANDROID_NDK}:$PATH

# Support Gradle
ENV TERM dumb

# install gradle
RUN wget https://services.gradle.org/distributions/gradle-2.13-all.zip
RUN unzip gradle-2.13-all.zip
RUN mv gradle-2.13 /usr/local
RUN rm gradle-2.13-all.zip
ENV GRADLE_HOME /usr/local/gradle-2.13
ENV PATH ${GRADLE_HOME}/bin:$PATH
