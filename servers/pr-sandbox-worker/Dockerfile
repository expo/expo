FROM docker.io/cloudflare/sandbox:0.11.0

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  cmake \
  openjdk-17-jdk-headless \
  && rm -rf /var/lib/apt/lists/*
