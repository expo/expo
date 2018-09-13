FROM circleci/node:8-stretch

RUN sudo apt-get update && \
  sudo apt-get install -y --no-install-recommends \
  build-essential \
  emacs \
  gradle \
  nano \
  openjdk-8-jdk-headless \
  procps \
  vim \
  && sudo apt-get autoremove && \
  sudo apt-get clean

# Download and untar SDK
ENV ANDROID_HOME /usr/local/android-sdk-linux
ENV ANDROID_SDK /usr/local/android-sdk-linux
ENV ANDROID_SDK_URL https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip
RUN sudo mkdir -p ${ANDROID_HOME} && sudo chown -R $(whoami):$(whoami) ${ANDROID_HOME} && \
    curl -L "${ANDROID_SDK_URL}" > ${ANDROID_HOME}/sdk.zip && \
    cd ${ANDROID_HOME} && \
    unzip -q sdk.zip && \
    rm sdk.zip && \
    # prevents warnings about missing repo config
    mkdir -p ${HOME}/.android && \
    touch ${HOME}/.android/repositories.cfg

ENV PATH ${ANDROID_HOME}/platform-tools:${PATH}
ENV PATH ${ANDROID_HOME}/tools:${PATH}
ENV PATH ${ANDROID_HOME}/tools/bin:${PATH}
ENV PATH ${ANDROID_HOME}/build-tools/25.0.0/:${PATH}

RUN yes | sdkmanager --licenses > /dev/null

# Install Android SDK components
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-23" \
    "build-tools;25.0.0" \
    "extras;android;m2repository" \
    "extras;google;m2repository"

# Install Android NDK
ENV ANDROID_NDK_VERSION android-ndk-r10e
ENV ANDROID_NDK_FILE ${ANDROID_NDK_VERSION}-linux-x86_64.bin
ENV ANDROID_NDK_URL https://dl.google.com/android/ndk/${ANDROID_NDK_FILE}
ENV ANDROID_NDK /opt/${ANDROID_NDK_VERSION}
ENV PATH $ANDROID_NDK:$PATH

# i have no clue why some of this is here, but it's working elsewhere
# it appears to install the NDK version expo needs, so that's cool
RUN sudo mkdir /ndk_setup && sudo chown $(whoami):$(whoami) /ndk_setup && \
  cd /ndk_setup && \
  curl -L ${ANDROID_NDK_URL} > ${ANDROID_NDK_FILE} && \
  chmod +x ${ANDROID_NDK_FILE} && \
  sync && \
  sudo ./${ANDROID_NDK_FILE} && \
  sudo mv ./${ANDROID_NDK_VERSION} ${ANDROID_NDK} && \
  sudo cp -R \
    ${ANDROID_NDK}/toolchains/arm-linux-androideabi-4.8/prebuilt/linux-x86_64 \
    ${ANDROID_NDK}/toolchains/arm-linux-androideabi-4.8/prebuilt/linux-x86 && \
  sudo cp -R \
    ${ANDROID_NDK}/toolchains/x86-4.8/prebuilt/linux-x86_64 \
    ${ANDROID_NDK}/toolchains/x86-4.8/prebuilt/linux-x86 && \
  cd && sudo rm -rf /ndk_setup && \
  sudo chown -R $(whoami):$(whoami) ${ANDROID_NDK}

RUN yarn global add eslint@4.19.1 gulp@4.0.0

RUN git config --global --add http.sslCAInfo /etc/ssl/certs/ca-certificates.crt
