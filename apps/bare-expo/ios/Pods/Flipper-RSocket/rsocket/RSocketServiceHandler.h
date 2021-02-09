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

#include <folly/Expected.h>

#include "rsocket/RSocketConnectionEvents.h"
#include "rsocket/RSocketException.h"
#include "rsocket/RSocketParameters.h"
#include "rsocket/RSocketResponder.h"
#include "rsocket/RSocketServerState.h"
#include "rsocket/RSocketStats.h"
#include "rsocket/internal/Common.h"

namespace rsocket {

// This is a convenience function which is used to create a simplified
// RSocketServiceHandler.
using OnNewSetupFn =
    folly::Function<std::shared_ptr<RSocketResponder>(const SetupParameters&)>;

// This struct holds all the necessary information needed by the RSocketServer
// to initiate a connection with a client.
struct RSocketConnectionParams {
  explicit RSocketConnectionParams(
      std::shared_ptr<RSocketResponder> _responder,
      std::shared_ptr<RSocketStats> _stats = RSocketStats::noop(),
      std::shared_ptr<RSocketConnectionEvents> _connectionEvents = nullptr)
      : responder(std::move(_responder)),
        stats(std::move(_stats)),
        connectionEvents(std::move(_connectionEvents)) {}
  std::shared_ptr<RSocketResponder> responder;
  std::shared_ptr<RSocketStats> stats;
  std::shared_ptr<RSocketConnectionEvents> connectionEvents;
};

// This class has to be implemented by the application.  The methods can be
// called from different threads and it is the application's responsibility to
// ensure thread-safety.
//
// A RSocketServiceHandler instance should be passed as parameter to the
// RSocketServer::start() methods.  The passed instance will apply globally to
// all connections handled by the server.
//
// If the application wishes to preserve per connection information at the
// transport level (say HTTP Auth, TCP options) and use it at the application
// layer OR if the application wishes to have per-connection
// RSocketServiceHandler, then it should pass an instance of
// RSocketServiceHandler to the RSocketServer::acceptConnection() method. In
// this case it does not have to worry about thread safety.
//
class RSocketServiceHandler {
 public:
  RSocketServiceHandler() = default;
  virtual ~RSocketServiceHandler() = default;
  RSocketServiceHandler(RSocketServiceHandler&&) = default; // move
  RSocketServiceHandler& operator=(RSocketServiceHandler&&) = default; // move

  // This method gets called for each client that connects to the server.  The
  // application has to implement this method.  If the application does not
  // want to accept this connection, it should return a RSocketException.  If
  // the application returns a RSocketException, then an ERROR frame with code
  // REJECTED_SETUP is sent to the client.  The exception message is sent as
  // payload.
  virtual folly::Expected<RSocketConnectionParams, RSocketException> onNewSetup(
      const SetupParameters&) = 0;

  // This method gets called after some state is created for each client.  The
  // application should preserve the RSocketServerState if it wants to resume
  // the connection later.
  virtual void onNewRSocketState(
      std::shared_ptr<RSocketServerState>,
      ResumeIdentificationToken);

  // This method gets called when a client tries to resume. The application
  // should return the corresponding RSocketServerState for the given resumeId
  // if it wants to resume.  The application should return a RSocketException
  // if it does not want to resume.  If the application returns a
  // RSocketException, then an ERROR frame with code REJECTED_RESUME is sent to
  // the client.  The exception message is sent as payload.
  virtual folly::Expected<std::shared_ptr<RSocketServerState>, RSocketException>
      onResume(ResumeIdentificationToken);

  // This method gives a fine-grained control to the application during
  // resumption (provided it agreed to resume in the onResume() call above).
  // It tells the application what streams will be resumed in clean/dirty
  // state.  If the application is okay with resuming the given clean/dirty
  // streams, it should return true.
  virtual bool canResume(
      const std::vector<StreamId>& /* cleanStreamIds */,
      const std::vector<StreamId>& /* dirtyStreamIds */,
      ResumeIdentificationToken) const;

  // Convenience constructor to create a simple RSocketServiceHandler.
  static std::shared_ptr<RSocketServiceHandler> create(
      OnNewSetupFn onNewSetupFn);
};
} // namespace rsocket
