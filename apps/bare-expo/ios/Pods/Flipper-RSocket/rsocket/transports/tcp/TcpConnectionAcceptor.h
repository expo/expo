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

#pragma once

#include <folly/io/async/AsyncServerSocket.h>
#include <folly/io/async/ScopedEventBaseThread.h>

#include "rsocket/ConnectionAcceptor.h"

namespace rsocket {

/**
 * TCP implementation of ConnectionAcceptor for use with RSocket::createServer
 *
 * Construction of this does nothing.  The `start` method kicks off work.
 */
class TcpConnectionAcceptor : public ConnectionAcceptor {
 public:
  struct Options {
    /// Address to listen on
    folly::SocketAddress address{"::", 8080};

    /// Number of worker threads processing requests.
    size_t threads{2};

    /// Number of connections to buffer before accept handlers process them.
    int backlog{10};
  };

  explicit TcpConnectionAcceptor(Options);
  ~TcpConnectionAcceptor();

  // ConnectionAcceptor overrides.

  /**
   * Bind an AsyncServerSocket and start accepting TCP connections.
   */
  void start(OnDuplexConnectionAccept) override;

  /**
   * Shutdown the AsyncServerSocket and associated listener thread.
   */
  void stop() override;

  /**
   * Get the port being listened on.
   */
  folly::Optional<uint16_t> listeningPort() const override;

 private:
  class SocketCallback;

  /// Options this acceptor has been configured with.
  const Options options_;

  /// The thread driving the AsyncServerSocket.
  std::unique_ptr<folly::ScopedEventBaseThread> serverThread_;

  /// Function to run when a connection is accepted.
  OnDuplexConnectionAccept onAccept_;

  /// The callbacks handling accepted connections.  Each has its own worker
  /// thread.
  std::vector<std::unique_ptr<SocketCallback>> callbacks_;

  /// The socket listening for new connections.
  folly::AsyncServerSocket::UniquePtr serverSocket_;
};

} // namespace rsocket
