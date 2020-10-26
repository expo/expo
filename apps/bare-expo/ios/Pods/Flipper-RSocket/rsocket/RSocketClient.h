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

#include <folly/futures/Future.h>

#include "rsocket/ColdResumeHandler.h"
#include "rsocket/ConnectionFactory.h"
#include "rsocket/DuplexConnection.h"
#include "rsocket/RSocketConnectionEvents.h"
#include "rsocket/RSocketParameters.h"
#include "rsocket/RSocketRequester.h"
#include "rsocket/RSocketResponder.h"
#include "rsocket/RSocketStats.h"
#include "rsocket/ResumeManager.h"

namespace rsocket {

class RSocket;

/**
 * API for connecting to an RSocket server. Created with RSocket class.
 * This connects using a transport from the provided ConnectionFactory.
 */
class RSocketClient {
 public:
  ~RSocketClient();

  RSocketClient(const RSocketClient&) = delete;
  RSocketClient(RSocketClient&&) = delete;
  RSocketClient& operator=(const RSocketClient&) = delete;
  RSocketClient& operator=(RSocketClient&&) = delete;

  friend class RSocket;

  // Returns the RSocketRequester associated with the RSocketClient.
  const std::shared_ptr<RSocketRequester>& getRequester() const;

  // Returns if this client is currently disconnected
  bool isDisconnected() const;

  // Resumes the client's connection.  If the client was previously connected
  // this will attempt a warm-resumption.  Otherwise this will attempt a
  // cold-resumption.
  //
  // Uses the internal ConnectionFactory instance to re-connect.
  folly::Future<folly::Unit> resume();

  // Like resume(), but this doesn't use a ConnectionFactory and instead takes
  // the connection and transport EventBase by argument.
  //
  // Prefer using resume() if possible.
  folly::Future<folly::Unit> resumeFromConnection(
      ConnectionFactory::ConnectedDuplexConnection);

  // Disconnect the underlying transport.
  folly::Future<folly::Unit> disconnect(folly::exception_wrapper = {});

 private:
  // Private constructor.  RSocket class should be used to create instances
  // of RSocketClient.
  RSocketClient(
      std::shared_ptr<ConnectionFactory>,
      ProtocolVersion protocolVersion,
      ResumeIdentificationToken token,
      std::shared_ptr<RSocketResponder> responder,
      std::chrono::milliseconds keepaliveInterval,
      std::shared_ptr<RSocketStats> stats,
      std::shared_ptr<RSocketConnectionEvents> connectionEvents,
      std::shared_ptr<ResumeManager> resumeManager,
      std::shared_ptr<ColdResumeHandler> coldResumeHandler,
      folly::EventBase* stateMachineEvb);

  // Create stateMachine with the given DuplexConnection
  void fromConnection(
      std::unique_ptr<DuplexConnection> connection,
      folly::EventBase& transportEvb,
      SetupParameters setupParameters);

  // Creates RSocketStateMachine and RSocketRequester
  void createState();

  const std::shared_ptr<ConnectionFactory> connectionFactory_;
  std::shared_ptr<RSocketResponder> responder_;
  const std::chrono::milliseconds keepaliveInterval_;
  std::shared_ptr<RSocketStats> stats_;
  std::shared_ptr<RSocketConnectionEvents> connectionEvents_;
  std::shared_ptr<ResumeManager> resumeManager_;
  std::shared_ptr<ColdResumeHandler> coldResumeHandler_;

  std::shared_ptr<RSocketStateMachine> stateMachine_;
  std::shared_ptr<RSocketRequester> requester_;

  const ProtocolVersion protocolVersion_;
  const ResumeIdentificationToken token_;

  // Remember the StateMachine's evb (supplied through constructor).  If no
  // EventBase is provided, the underlying transport's EventBase will be used
  // to drive the StateMachine.
  // If an EventBase is provided for StateMachine and underlying Transport's
  // EventBase is different from it, then we use Scheduled* classes to let the
  // StateMachine and Transport live on different EventBases.
  // It might happen that the StateMachine and Transport live on same
  // EventBase, but the transport ends up being in different EventBase after
  // resumption, and vice versa.
  folly::EventBase* evb_{nullptr};
};
} // namespace rsocket
