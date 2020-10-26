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

#include "rsocket/transports/tcp/TcpDuplexConnection.h"

#include <folly/ExceptionWrapper.h>
#include <folly/io/IOBufQueue.h>

#include "rsocket/internal/Common.h"
#include "yarpl/flowable/Subscription.h"

namespace rsocket {

using namespace yarpl::flowable;

class TcpReaderWriter : public folly::AsyncTransportWrapper::WriteCallback,
                        public folly::AsyncTransportWrapper::ReadCallback {
  friend void intrusive_ptr_add_ref(TcpReaderWriter* x);
  friend void intrusive_ptr_release(TcpReaderWriter* x);

 public:
  explicit TcpReaderWriter(
      folly::AsyncTransportWrapper::UniquePtr&& socket,
      std::shared_ptr<RSocketStats> stats)
      : socket_(std::move(socket)), stats_(std::move(stats)) {}

  ~TcpReaderWriter() override {
    CHECK(isClosed());
    DCHECK(!inputSubscriber_);
  }

  folly::AsyncTransportWrapper* getTransport() {
    return socket_.get();
  }

  void setInput(std::shared_ptr<DuplexConnection::Subscriber> inputSubscriber) {
    if (inputSubscriber && isClosed()) {
      inputSubscriber->onComplete();
      return;
    }

    if (!inputSubscriber) {
      inputSubscriber_ = nullptr;
      return;
    }

    CHECK(!inputSubscriber_);
    inputSubscriber_ = std::move(inputSubscriber);

    if (!socket_->getReadCallback()) {
      // The AsyncSocket will hold a reference to this instance until it calls
      // readEOF or readErr.
      intrusive_ptr_add_ref(this);
      socket_->setReadCB(this);
    }
  }

  void send(std::unique_ptr<folly::IOBuf> element) {
    if (isClosed()) {
      return;
    }

    if (stats_) {
      stats_->bytesWritten(element->computeChainDataLength());
    }
    // now AsyncSocket will hold a reference to this instance as a writer until
    // they call writeComplete or writeErr
    intrusive_ptr_add_ref(this);
    socket_->writeChain(this, std::move(element));
  }

  void close() {
    if (auto socket = std::move(socket_)) {
      socket->close();
    }
    if (auto subscriber = std::move(inputSubscriber_)) {
      subscriber->onComplete();
    }
  }

  void closeErr(folly::exception_wrapper ew) {
    if (auto socket = std::move(socket_)) {
      socket->close();
    }
    if (auto subscriber = std::move(inputSubscriber_)) {
      subscriber->onError(std::move(ew));
    }
  }

 private:
  bool isClosed() const {
    return !socket_;
  }

  void writeSuccess() noexcept override {
    intrusive_ptr_release(this);
  }

  void writeErr(
      size_t,
      const folly::AsyncSocketException& exn) noexcept override {
    closeErr(folly::exception_wrapper{std::make_exception_ptr(exn), exn});
    intrusive_ptr_release(this);
  }

  void getReadBuffer(void** bufReturn, size_t* lenReturn) noexcept override {
    std::tie(*bufReturn, *lenReturn) = readBuffer_.preallocate(4096, 4096);
  }

  void readDataAvailable(size_t len) noexcept override {
    readBuffer_.postallocate(len);
    if (stats_) {
      stats_->bytesRead(len);
    }

    if (inputSubscriber_) {
      readBufferAvailable(readBuffer_.split(len));
    }
  }

  void readEOF() noexcept override {
    close();
    intrusive_ptr_release(this);
  }

  void readErr(const folly::AsyncSocketException& exn) noexcept override {
    closeErr(folly::exception_wrapper{std::make_exception_ptr(exn), exn});
    intrusive_ptr_release(this);
  }

  bool isBufferMovable() noexcept override {
    return true;
  }

  void readBufferAvailable(
      std::unique_ptr<folly::IOBuf> readBuf) noexcept override {
    CHECK(inputSubscriber_);
    inputSubscriber_->onNext(std::move(readBuf));
  }

  folly::IOBufQueue readBuffer_{folly::IOBufQueue::cacheChainLength()};
  folly::AsyncTransportWrapper::UniquePtr socket_;
  const std::shared_ptr<RSocketStats> stats_;

  std::shared_ptr<DuplexConnection::Subscriber> inputSubscriber_;
  int refCount_{0};
};

void intrusive_ptr_add_ref(TcpReaderWriter* x);
void intrusive_ptr_release(TcpReaderWriter* x);

inline void intrusive_ptr_add_ref(TcpReaderWriter* x) {
  ++x->refCount_;
}

inline void intrusive_ptr_release(TcpReaderWriter* x) {
  if (--x->refCount_ == 0)
    delete x;
}

namespace {

class TcpInputSubscription : public Subscription {
 public:
  explicit TcpInputSubscription(
      boost::intrusive_ptr<TcpReaderWriter> tcpReaderWriter)
      : tcpReaderWriter_(std::move(tcpReaderWriter)) {
    CHECK(tcpReaderWriter_);
  }

  void request(int64_t n) noexcept override {
    DCHECK(tcpReaderWriter_);
    DCHECK_EQ(n, std::numeric_limits<int64_t>::max())
        << "TcpDuplexConnection doesnt support proper flow control";
  }

  void cancel() noexcept override {
    tcpReaderWriter_->setInput(nullptr);
    tcpReaderWriter_ = nullptr;
  }

 private:
  boost::intrusive_ptr<TcpReaderWriter> tcpReaderWriter_;
};

} // namespace

TcpDuplexConnection::TcpDuplexConnection(
    folly::AsyncTransportWrapper::UniquePtr&& socket,
    std::shared_ptr<RSocketStats> stats)
    : tcpReaderWriter_(new TcpReaderWriter(std::move(socket), stats)),
      stats_(stats) {
  if (stats_) {
    stats_->duplexConnectionCreated("tcp", this);
  }
}

TcpDuplexConnection::~TcpDuplexConnection() {
  if (stats_) {
    stats_->duplexConnectionClosed("tcp", this);
  }
  tcpReaderWriter_->close();
}

folly::AsyncTransportWrapper* TcpDuplexConnection::getTransport() {
  return tcpReaderWriter_ ? tcpReaderWriter_->getTransport() : nullptr;
}

void TcpDuplexConnection::send(std::unique_ptr<folly::IOBuf> buf) {
  if (tcpReaderWriter_) {
    tcpReaderWriter_->send(std::move(buf));
  }
}

void TcpDuplexConnection::setInput(
    std::shared_ptr<DuplexConnection::Subscriber> inputSubscriber) {
  // we don't care if the subscriber will call request synchronously
  inputSubscriber->onSubscribe(
      std::make_shared<TcpInputSubscription>(tcpReaderWriter_));
  tcpReaderWriter_->setInput(std::move(inputSubscriber));
}
} // namespace rsocket
