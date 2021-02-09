// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <arpa/inet.h>
#include <folly/Benchmark.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#include <array>
#include <atomic>
#include <cstring>
#include <iostream>
#include <thread>

#define MAX_MESSAGE_LENGTH (8 * 1024)
#define PORT (35437)

static void BM_Baseline_TCP_SendReceive(
    size_t loadSize,
    size_t msgLength,
    size_t recvLength) {
  std::atomic<bool> accepting{false};
  std::atomic<bool> accepted{false};

  std::thread t([&]() {
    int serverSock = socket(AF_INET, SOCK_STREAM, 0);
    int sock = -1;
    struct sockaddr_in addr = {};
    socklen_t addrlen = sizeof(addr);
    std::array<char, MAX_MESSAGE_LENGTH> message = {};

    if (serverSock < 0) {
      perror("acceptor socket");
      return;
    }

    int enable = 1;
    if (setsockopt(
            serverSock, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(enable)) <
        0) {
      perror("setsocketopt SO_REUSEADDR");
      return;
    }

    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(PORT);
    if (bind(serverSock, reinterpret_cast<struct sockaddr*>(&addr), addrlen) <
        0) {
      perror("bind");
      return;
    }

    if (listen(serverSock, 1) < 0) {
      perror("listen");
      return;
    }

    accepting.store(true);

    if ((sock = accept(
             serverSock, reinterpret_cast<struct sockaddr*>(&addr), &addrlen)) <
        0) {
      perror("accept");
      return;
    }

    accepted.store(true);

    size_t sentBytes = 0;
    while (sentBytes < loadSize) {
      if (send(sock, message.data(), msgLength, 0) !=
          static_cast<ssize_t>(msgLength)) {
        perror("send");
        return;
      }
      sentBytes += msgLength;
    }

    close(sock);
    close(serverSock);
  });

  while (!accepting) {
    std::this_thread::yield();
  }

  const int sock = socket(AF_INET, SOCK_STREAM, 0);
  struct sockaddr_in addr = {};
  const socklen_t addrlen = sizeof(addr);
  std::array<char, MAX_MESSAGE_LENGTH> message = {};

  if (sock < 0) {
    perror("connector socket");
    return;
  }

  addr.sin_family = AF_INET;
  addr.sin_addr.s_addr = inet_addr("127.0.0.1");
  addr.sin_port = htons(PORT);
  if (connect(sock, reinterpret_cast<struct sockaddr*>(&addr), addrlen) < 0) {
    perror("connect");
    return;
  }

  while (!accepted) {
    std::this_thread::yield();
  }

  size_t receivedBytes = 0;
  while (receivedBytes < loadSize) {
    const ssize_t recved = recv(sock, message.data(), recvLength, 0);

    if (recved < 0) {
      perror("recv");
      return;
    }

    receivedBytes += recved;
  }

  close(sock);
  t.join();
}

BENCHMARK(BM_Baseline_TCP_Throughput_100MB_s40B_r1024B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 40;
  constexpr size_t receiveSizeB = 1024;
  BM_Baseline_TCP_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}
BENCHMARK(BM_Baseline_TCP_Throughput_100MB_s40B_r4096B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 40;
  constexpr size_t receiveSizeB = 4096;
  BM_Baseline_TCP_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}
BENCHMARK(BM_Baseline_TCP_Throughput_100MB_s80B_r4096B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 80;
  constexpr size_t receiveSizeB = 4096;
  BM_Baseline_TCP_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}
BENCHMARK(BM_Baseline_TCP_Throughput_100MB_s4096B_r4096B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 4096;
  constexpr size_t receiveSizeB = 4096;
  BM_Baseline_TCP_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}

BENCHMARK(BM_Baseline_TCP_Latency_1M_msgs_32B, n) {
  (void)n;
  constexpr size_t messageSizeB = 32;
  constexpr size_t loadSizeB = 1000000 * messageSizeB;
  BM_Baseline_TCP_SendReceive(loadSizeB, messageSizeB, messageSizeB);
}
BENCHMARK(BM_Baseline_TCP_Latency_1M_msgs_128B, n) {
  (void)n;
  constexpr size_t messageSizeB = 128;
  constexpr size_t loadSizeB = 1000000 * messageSizeB;
  BM_Baseline_TCP_SendReceive(loadSizeB, messageSizeB, messageSizeB);
}
BENCHMARK(BM_Baseline_TCP_Latency_1M_msgs_4kB, n) {
  (void)n;
  constexpr size_t messageSizeB = 4096;
  constexpr size_t loadSizeB = 1000000 * messageSizeB;
  BM_Baseline_TCP_SendReceive(loadSizeB, messageSizeB, messageSizeB);
}
