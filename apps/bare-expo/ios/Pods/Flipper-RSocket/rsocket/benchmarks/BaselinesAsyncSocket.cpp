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

#include <folly/Benchmark.h>
#include <folly/io/IOBufQueue.h>
#include <folly/io/async/AsyncServerSocket.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/io/async/ScopedEventBaseThread.h>

#define PORT (35437)

// namespace {
//
// class TcpReader : public ::folly::AsyncTransportWrapper::ReadCallback {
// public:
//  TcpReader(
//      folly::AsyncTransportWrapper::UniquePtr&& socket,
//      EventBase& eventBase,
//      size_t loadSize,
//      size_t recvBufferLength)
//      : socket_(std::move(socket)),
//        eventBase_(eventBase),
//        loadSize_(loadSize),
//        recvBufferLength_(recvBufferLength) {
//    socket_->setReadCB(this);
//  }
//
// private:
//  void getReadBuffer(void** bufReturn, size_t* lenReturn) noexcept override {
//    std::tie(*bufReturn, *lenReturn) =
//        readBuffer_.preallocate(recvBufferLength_, recvBufferLength_);
//  }
//
//  void readDataAvailable(size_t len) noexcept override {
//    readBuffer_.postallocate(len);
//    auto readData = readBuffer_.split(len);
//
//    receivedLength_ += readData->computeChainDataLength();
//    ++reads_;
//    if (receivedLength_ >= loadSize_) {
//      LOG(INFO) << "closing reader";
//      close();
//    }
//  }
//
//  void readBufferAvailable(
//      std::unique_ptr<folly::IOBuf> readBuf) noexcept override {
//    receivedLength_ += readBuf->computeChainDataLength();
//    ++reads_;
//    if (receivedLength_ >= loadSize_) {
//      LOG(INFO) << "closing reader";
//      close();
//    }
//  }
//
//  void readEOF() noexcept override {
//    LOG(INFO) << "closing reader";
//    close();
//  }
//
//  void readErr(const folly::AsyncSocketException& exn) noexcept override {
//    LOG(ERROR) << exn.what();
//    close();
//  }
//
//  bool isBufferMovable() noexcept override {
//    return true;
//  }
//
//  void close() {
//    if (socket_) {
//      LOG(INFO) << "received " << receivedLength_ << " via " << reads_
//                << " reads";
//      auto socket = std::move(socket_);
//      socket->close();
//      eventBase_.terminateLoopSoon();
//      delete this;
//    }
//  }
//
//  folly::AsyncTransportWrapper::UniquePtr socket_;
//  folly::IOBufQueue readBuffer_{folly::IOBufQueue::cacheChainLength()};
//  EventBase& eventBase_;
//  const size_t loadSize_;
//  const size_t recvBufferLength_;
//  size_t receivedLength_{0};
//  int reads_{0};
//};
//
// class ServerAcceptCallback : public AsyncServerSocket::AcceptCallback {
// public:
//  ServerAcceptCallback(
//      EventBase& eventBase,
//      size_t loadSize,
//      size_t recvBufferLength)
//      : eventBase_(eventBase),
//        loadSize_(loadSize),
//        recvBufferLength_(recvBufferLength) {}
//
//  void connectionAccepted(
//      int fd,
//      const SocketAddress&) noexcept override {
//    auto socket =
//        folly::AsyncTransportWrapper::UniquePtr(new AsyncSocket(&eventBase_,
//        fd));
//
//    new TcpReader(
//        std::move(socket), eventBase_, loadSize_, recvBufferLength_);
//  }
//
//  void acceptError(const std::exception& ex) noexcept override {
//    LOG(FATAL) << "acceptError" << ex.what() << std::endl;
//    eventBase_.terminateLoopSoon();
//  }
//
// private:
//  EventBase& eventBase_;
//  const size_t loadSize_;
//  const size_t recvBufferLength_;
//};
//
// class TcpWriter : public ::folly::AsyncTransportWrapper::WriteCallback {
// public:
//  ~TcpWriter() {
//    LOG(INFO) << "writes=" << writes_ << " success=" << success_ << " errors="
//              << errors_;
//  }
//
//  void startWriting(AsyncSocket& socket, size_t loadSize,
//                    size_t messageSize) {
//    size_t bytesSent{0};
//
//    while (!closed_ && bytesSent < loadSize) {
//      auto data = IOBuf::copyBuffer(std::string(messageSize, 'a'));
//      socket.writeChain(this, std::move(data));
//      ++writes_;
//      bytesSent += messageSize;
//    }
//    LOG(INFO) << "wrote " << bytesSent << " closed=" << closed_;
//  }
//
// private:
//  void writeSuccess() noexcept override {
//    ++success_;
//  }
//
//  void writeErr(
//      size_t,
//      const folly::AsyncSocketException& exn) noexcept override {
//    LOG_EVERY_N(ERROR,10000) << "writeError: " << exn.what();
//    closed_ = true;
//    ++errors_;
//  }
//
//  bool closed_{false};
//  int writes_{0};
//  int success_{0};
//  int errors_{0};
//};
//
// class ClientConnectCallback : public AsyncSocket::ConnectCallback {
// public:
//  ClientConnectCallback(EventBase& eventBase, size_t loadSize,
//                        size_t msgLength)
//      : eventBase_(eventBase), loadSize_(loadSize), msgLength_(msgLength) {}
//
//  void connect() {
//    eventBase_.runInEventBaseThread([this] {
//      socket_.reset(new AsyncSocket(&eventBase_));
//      SocketAddress clientAaddr("::", PORT);
//      socket_->connect(this, clientAaddr);
//    });
//  }
//
// private:
//  void connectSuccess() noexcept override {
//    {
//      TcpWriter writer;
//      LOG(INFO) << "startWriting";
//      writer.startWriting(*socket_, loadSize_, msgLength_);
//      LOG(INFO) << "endWriting";
//      socket_->close();
//      LOG(INFO) << "socket closed, deleting this";
//    }
//    delete this;
//  }
//
//  void connectErr(const AsyncSocketException& ex) noexcept override {
//    LOG(FATAL) << "connectErr: " << ex.what() << " " << ex.getType();
//    delete this;
//  }
//
//  AsyncTransportWrapper::UniquePtr socket_;
//  EventBase& eventBase_;
//  const size_t loadSize_;
//  const size_t msgLength_;
//};
//}

static void BM_Baseline_AsyncSocket_SendReceive(
    size_t /*loadSize*/,
    size_t /*msgLength*/,
    size_t /*recvLength*/) {
  LOG_EVERY_N(INFO, 10000) << "TODO(lehecka): benchmark needs updating, "
                           << "it has memory corruption bugs";
  //  EventBase serverEventBase;
  //  auto serverSocket = AsyncServerSocket::newSocket(&serverEventBase);
  //
  //  ServerAcceptCallback serverCallback(serverEventBase, loadSize,
  //  recvLength);
  //
  //  SocketAddress addr("::", PORT);
  //
  //  serverSocket->setReusePortEnabled(true);
  //  serverSocket->bind(addr);
  //  serverSocket->addAcceptCallback(&serverCallback, &serverEventBase);
  //  serverSocket->listen(1);
  //  serverSocket->startAccepting();
  //
  //  ScopedEventBaseThread clientThread;
  //  auto* clientCallback = new ClientConnectCallback(
  //      *clientThread.getEventBase(), loadSize, msgLength);
  //  clientCallback->connect();
  //
  //  serverEventBase.loopForever();
}

BENCHMARK(BM_Baseline_AsyncSocket_Throughput_100MB_s40B_r1024B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 40;
  constexpr size_t receiveSizeB = 1024;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}
BENCHMARK(BM_Baseline_AsyncSocket_Throughput_100MB_s40B_r4096B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 40;
  constexpr size_t receiveSizeB = 4096;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}
BENCHMARK(BM_Baseline_AsyncSocket_Throughput_100MB_s80B_r4096B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 80;
  constexpr size_t receiveSizeB = 4096;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}
BENCHMARK(BM_Baseline_AsyncSocket_Throughput_100MB_s4096B_r4096B, n) {
  (void)n;
  constexpr size_t loadSizeB = 100 * 1024 * 1024;
  constexpr size_t sendSizeB = 4096;
  constexpr size_t receiveSizeB = 4096;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, sendSizeB, receiveSizeB);
}

BENCHMARK(BM_Baseline_AsyncSocket_Latency_1M_msgs_32B, n) {
  (void)n;
  constexpr size_t messageSizeB = 32;
  constexpr size_t loadSizeB = 1000000 * messageSizeB;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, messageSizeB, messageSizeB);
}
BENCHMARK(BM_Baseline_AsyncSocket_Latency_1M_msgs_128B, n) {
  (void)n;
  constexpr size_t messageSizeB = 128;
  constexpr size_t loadSizeB = 1000000 * messageSizeB;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, messageSizeB, messageSizeB);
}
BENCHMARK(BM_Baseline_AsyncSocket_Latency_1M_msgs_4kB, n) {
  (void)n;
  constexpr size_t messageSizeB = 4096;
  constexpr size_t loadSizeB = 1000000 * messageSizeB;
  BM_Baseline_AsyncSocket_SendReceive(loadSizeB, messageSizeB, messageSizeB);
}
