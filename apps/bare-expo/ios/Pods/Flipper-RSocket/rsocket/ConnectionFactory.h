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

#include <folly/Function.h>
#include <folly/futures/Future.h>
#include "rsocket/DuplexConnection.h"
#include "rsocket/framing/ProtocolVersion.h"

namespace folly {
class EventBase;
}

namespace rsocket {

enum class ResumeStatus { NEW_SESSION, RESUMING };

/**
 * Common interface for a client to create connections and turn them into
 * DuplexConnections.
 *
 * This is primarily used with RSocket::createClient(ConnectionFactory)
 *
 * Built-in implementations can be found in rsocket/transports/, such as
 * rsocket/transports/TcpConnectionFactory.h
 */
class ConnectionFactory {
 public:
  ConnectionFactory() = default;
  virtual ~ConnectionFactory() = default;
  ConnectionFactory(const ConnectionFactory&) = delete; // copy
  ConnectionFactory(ConnectionFactory&&) = delete; // move
  ConnectionFactory& operator=(const ConnectionFactory&) = delete; // copy
  ConnectionFactory& operator=(ConnectionFactory&&) = delete; // move

  struct ConnectedDuplexConnection {
    std::unique_ptr<rsocket::DuplexConnection> connection;
    folly::EventBase& eventBase;
  };

  /**
   * Connect to server defined by constructor of the implementing class.
   *
   * Every time this is called a new transport connection is made. This does not
   * however mean it is a physical connection. An implementation could choose to
   * multiplex many RSocket connections on a single transport.
   *
   * Resource creation depends on the particular implementation.
   */
  virtual folly::Future<ConnectedDuplexConnection> connect(
      ProtocolVersion,
      ResumeStatus resume) = 0;
};
} // namespace rsocket
