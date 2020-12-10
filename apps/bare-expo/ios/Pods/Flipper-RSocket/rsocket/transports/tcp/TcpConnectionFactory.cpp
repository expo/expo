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

#include "rsocket/transports/tcp/TcpConnectionFactory.h"

#include <folly/io/async/AsyncSSLSocket.h>
#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/io/async/EventBaseManager.h>
#include <glog/logging.h>

#include "rsocket/transports/tcp/TcpDuplexConnection.h"

namespace rsocket {

namespace {

class ConnectCallback : public folly::AsyncSocket::ConnectCallback {
 public:
  ConnectCallback(
      folly::SocketAddress address,
      const std::shared_ptr<folly::SSLContext>& sslContext,
      folly::Promise<ConnectionFactory::ConnectedDuplexConnection>
          connectPromise)
      : address_(address), connectPromise_(std::move(connectPromise)) {
    VLOG(2) << "Constructing ConnectCallback";

    // Set up by ScopedEventBaseThread.
    auto evb = folly::EventBaseManager::get()->getExistingEventBase();
    DCHECK(evb);

    if (sslContext) {
#if !FOLLY_OPENSSL_HAS_ALPN
      // setAdvertisedNextProtocols() is unavailable
#error ALPN is required for rsockets. \
      Your version of OpenSSL is likely too old.
#else
      VLOG(3) << "Starting SSL socket";
      sslContext->setAdvertisedNextProtocols({"rs"});
#endif
      socket_.reset(new folly::AsyncSSLSocket(sslContext, evb));
    } else {
      VLOG(3) << "Starting socket";
      socket_.reset(new folly::AsyncSocket(evb));
    }

    VLOG(3) << "Attempting connection to " << address_;

    socket_->connect(this, address_);
  }

  ~ConnectCallback() override {
    VLOG(2) << "Destroying ConnectCallback";
  }

  void connectSuccess() noexcept override {
    std::unique_ptr<ConnectCallback> deleter(this);
    VLOG(4) << "connectSuccess() on " << address_;

    auto connection = TcpConnectionFactory::createDuplexConnectionFromSocket(
        std::move(socket_), RSocketStats::noop());
    auto evb = folly::EventBaseManager::get()->getExistingEventBase();
    CHECK(evb);
    connectPromise_.setValue(ConnectionFactory::ConnectedDuplexConnection{
        std::move(connection), *evb});
  }

  void connectErr(const folly::AsyncSocketException& ex) noexcept override {
    std::unique_ptr<ConnectCallback> deleter(this);
    VLOG(4) << "connectErr(" << ex.what() << ") on " << address_;
    connectPromise_.setException(ex);
  }

 private:
  const folly::SocketAddress address_;
  folly::AsyncSocket::UniquePtr socket_;
  folly::Promise<ConnectionFactory::ConnectedDuplexConnection> connectPromise_;
};

} // namespace

TcpConnectionFactory::TcpConnectionFactory(
    folly::EventBase& eventBase,
    folly::SocketAddress address,
    std::shared_ptr<folly::SSLContext> sslContext)
    : eventBase_(&eventBase),
      address_(std::move(address)),
      sslContext_(std::move(sslContext)) {}

TcpConnectionFactory::~TcpConnectionFactory() = default;

folly::Future<ConnectionFactory::ConnectedDuplexConnection>
TcpConnectionFactory::connect(ProtocolVersion, ResumeStatus /* unused */) {
  folly::Promise<ConnectionFactory::ConnectedDuplexConnection> connectPromise;
  auto connectFuture = connectPromise.getFuture();

  eventBase_->runInEventBaseThread(
      [this, promise = std::move(connectPromise)]() mutable {
        new ConnectCallback(address_, sslContext_, std::move(promise));
      });
  return connectFuture;
}

std::unique_ptr<DuplexConnection>
TcpConnectionFactory::createDuplexConnectionFromSocket(
    folly::AsyncTransportWrapper::UniquePtr socket,
    std::shared_ptr<RSocketStats> stats) {
  return std::make_unique<TcpDuplexConnection>(
      std::move(socket), std::move(stats));
}

} // namespace rsocket
