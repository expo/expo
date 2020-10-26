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

#include "rsocket/transports/tcp/TcpConnectionAcceptor.h"

#include <folly/Format.h>
#include <folly/futures/Future.h>
#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/EventBaseManager.h>

#include "rsocket/transports/tcp/TcpDuplexConnection.h"

namespace rsocket {

class TcpConnectionAcceptor::SocketCallback
    : public folly::AsyncServerSocket::AcceptCallback {
 public:
  explicit SocketCallback(OnDuplexConnectionAccept& onAccept)
      : thread_{folly::sformat("rstcp-acceptor")}, onAccept_{onAccept} {}

  void connectionAccepted(
      folly::NetworkSocket fdNetworkSocket,
      const folly::SocketAddress& address) noexcept override {
    int fd = fdNetworkSocket.toFd();

    VLOG(2) << "Accepting TCP connection from " << address << " on FD " << fd;

    folly::AsyncTransportWrapper::UniquePtr socket(
        new folly::AsyncSocket(eventBase(), folly::NetworkSocket::fromFd(fd)));

    auto connection = std::make_unique<TcpDuplexConnection>(std::move(socket));
    onAccept_(std::move(connection), *eventBase());
  }

  void acceptError(const std::exception& ex) noexcept override {
    VLOG(2) << "TCP error: " << ex.what();
  }

  folly::EventBase* eventBase() const {
    return thread_.getEventBase();
  }

 private:
  /// The thread running this callback.
  folly::ScopedEventBaseThread thread_;

  /// Reference to the ConnectionAcceptor's callback.
  OnDuplexConnectionAccept& onAccept_;
};

TcpConnectionAcceptor::TcpConnectionAcceptor(Options options)
    : options_(std::move(options)) {}

TcpConnectionAcceptor::~TcpConnectionAcceptor() {
  if (serverThread_) {
    stop();
    serverThread_.reset();
  }
}

void TcpConnectionAcceptor::start(OnDuplexConnectionAccept onAccept) {
  if (onAccept_ != nullptr) {
    throw std::runtime_error("TcpConnectionAcceptor::start() already called");
  }

  onAccept_ = std::move(onAccept);
  serverThread_ =
      std::make_unique<folly::ScopedEventBaseThread>("rstcp-listener");

  callbacks_.reserve(options_.threads);
  for (size_t i = 0; i < options_.threads; ++i) {
    callbacks_.push_back(std::make_unique<SocketCallback>(onAccept_));
  }

  VLOG(1) << "Starting TCP listener on port " << options_.address.getPort()
          << " with " << options_.threads << " request threads";

  serverSocket_.reset(
      new folly::AsyncServerSocket(serverThread_->getEventBase()));

  // The AsyncServerSocket needs to be accessed from the listener thread only.
  // This will propagate out any exceptions the listener throws.
  folly::via(
      serverThread_->getEventBase(),
      [this] {
        serverSocket_->bind(options_.address);

        for (auto const& callback : callbacks_) {
          serverSocket_->addAcceptCallback(
              callback.get(), callback->eventBase());
        }

        serverSocket_->listen(options_.backlog);
        serverSocket_->startAccepting();

        for (const auto& i : serverSocket_->getAddresses()) {
          VLOG(1) << "Listening on " << i.describe();
        }
      })
      .get();
}

void TcpConnectionAcceptor::stop() {
  VLOG(1) << "Shutting down TCP listener";

  serverThread_->getEventBase()->runInEventBaseThreadAndWait(
      [serverSocket = std::move(serverSocket_)]() {});
}

folly::Optional<uint16_t> TcpConnectionAcceptor::listeningPort() const {
  if (!serverSocket_) {
    return folly::none;
  }
  return serverSocket_->getAddress().getPort();
}

} // namespace rsocket
