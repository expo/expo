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

#include <folly/SocketAddress.h>
#include <folly/io/async/AsyncTransport.h>

#include "rsocket/ConnectionFactory.h"
#include "rsocket/DuplexConnection.h"

namespace folly {

class SSLContext;
}

namespace rsocket {

class RSocketStats;

/**
 * TCP implementation of ConnectionFactory for use with RSocket::createClient().
 *
 * Creation of this does nothing.  The `start` method kicks off work.
 */
class TcpConnectionFactory : public ConnectionFactory {
 public:
  TcpConnectionFactory(
      folly::EventBase& eventBase,
      folly::SocketAddress address,
      std::shared_ptr<folly::SSLContext> sslContext = nullptr);
  virtual ~TcpConnectionFactory();

  /**
   * Connect to server defined in constructor.
   *
   * Each call to connect() creates a new AsyncSocket.
   */
  folly::Future<ConnectedDuplexConnection> connect(
      ProtocolVersion,
      ResumeStatus resume) override;

  static std::unique_ptr<DuplexConnection> createDuplexConnectionFromSocket(
      folly::AsyncTransportWrapper::UniquePtr socket,
      std::shared_ptr<RSocketStats> stats = std::shared_ptr<RSocketStats>());

 private:
  folly::EventBase* eventBase_;
  const folly::SocketAddress address_;
  std::shared_ptr<folly::SSLContext> sslContext_;
};
} // namespace rsocket
