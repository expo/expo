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

#include "rsocket/RSocketClient.h"
#include "rsocket/RSocketRequester.h"
#include "rsocket/RSocketResponder.h"
#include "rsocket/RSocketStats.h"
#include "rsocket/framing/FrameTransportImpl.h"
#include "rsocket/framing/FramedDuplexConnection.h"
#include "rsocket/framing/ScheduledFrameTransport.h"
#include "rsocket/internal/ClientResumeStatusCallback.h"
#include "rsocket/internal/KeepaliveTimer.h"

namespace rsocket {

RSocketClient::RSocketClient(
    std::shared_ptr<ConnectionFactory> connectionFactory,
    ProtocolVersion protocolVersion,
    ResumeIdentificationToken token,
    std::shared_ptr<RSocketResponder> responder,
    std::chrono::milliseconds keepaliveInterval,
    std::shared_ptr<RSocketStats> stats,
    std::shared_ptr<RSocketConnectionEvents> connectionEvents,
    std::shared_ptr<ResumeManager> resumeManager,
    std::shared_ptr<ColdResumeHandler> coldResumeHandler,
    folly::EventBase* stateMachineEvb)
    : connectionFactory_(std::move(connectionFactory)),
      responder_(std::move(responder)),
      keepaliveInterval_(keepaliveInterval),
      stats_(stats),
      connectionEvents_(connectionEvents),
      resumeManager_(resumeManager),
      coldResumeHandler_(coldResumeHandler),
      protocolVersion_(protocolVersion),
      token_(std::move(token)),
      evb_(stateMachineEvb) {
  CHECK(resumeManager_)
      << "provide ResumeManager::makeEmpty() instead of nullptr";
}

RSocketClient::~RSocketClient() {
  VLOG(3) << "~RSocketClient ..";

  evb_->runImmediatelyOrRunInEventBaseThreadAndWait([sm = stateMachine_] {
    auto exn = folly::make_exception_wrapper<std::runtime_error>(
        "RSocketClient is closing");
    sm->close(std::move(exn), StreamCompletionSignal::CONNECTION_END);
  });
}

const std::shared_ptr<RSocketRequester>& RSocketClient::getRequester() const {
  return requester_;
}

// Returns if this client is currently disconnected
bool RSocketClient::isDisconnected() const {
  return stateMachine_->isDisconnected();
}

folly::Future<folly::Unit> RSocketClient::resume() {
  CHECK(connectionFactory_)
      << "The client was likely created without ConnectionFactory. Can't "
      << "resume";

  return connectionFactory_->connect(protocolVersion_, ResumeStatus::RESUMING)
      .thenValue(
          [this](
              ConnectionFactory::ConnectedDuplexConnection connection) mutable {
            return resumeFromConnection(std::move(connection));
          });
}

folly::Future<folly::Unit> RSocketClient::resumeFromConnection(
    ConnectionFactory::ConnectedDuplexConnection connection) {
  VLOG(2) << "Resuming connection";

  if (!evb_) {
    // Cold-resumption.  EventBase hasn't been explicitly set for SM by the
    // application.  Use the transport's eventBase.
    evb_ = &connection.eventBase;
  }

  class ResumeCallback : public ClientResumeStatusCallback {
   public:
    explicit ResumeCallback(folly::Promise<folly::Unit> promise)
        : promise_(std::move(promise)) {}

    void onResumeOk() noexcept override {
      promise_.setValue();
    }

    void onResumeError(folly::exception_wrapper ex) noexcept override {
      promise_.setException(ex);
    }

   private:
    folly::Promise<folly::Unit> promise_;
  };

  folly::Promise<folly::Unit> promise;
  auto future = promise.getFuture();

  auto resumeCallback = std::make_unique<ResumeCallback>(std::move(promise));
  std::unique_ptr<DuplexConnection> framedConnection;
  if (connection.connection->isFramed()) {
    framedConnection = std::move(connection.connection);
  } else {
    framedConnection = std::make_unique<FramedDuplexConnection>(
        std::move(connection.connection), protocolVersion_);
  }
  auto transport =
      std::make_shared<FrameTransportImpl>(std::move(framedConnection));

  std::shared_ptr<FrameTransport> ft;
  if (evb_ != &connection.eventBase) {
    // If the StateMachine EventBase is different from the transport
    // EventBase, then use ScheduledFrameTransport and
    // ScheduledFrameProcessor to ensure the RSocketStateMachine and
    // Transport live on the desired EventBases
    ft = std::make_shared<ScheduledFrameTransport>(
        std::move(transport),
        &connection.eventBase, /* Transport EventBase */
        evb_); /* StateMachine EventBase */
  } else {
    ft = std::move(transport);
  }

  evb_->runInEventBaseThread([this,
                              frameTransport = std::move(ft),
                              callback = std::move(resumeCallback)]() mutable {
    if (!stateMachine_) {
      createState();
    }

    stateMachine_->resumeClient(
        token_,
        std::move(frameTransport),
        std::move(callback),
        protocolVersion_);
  });

  return future;
}

folly::Future<folly::Unit> RSocketClient::disconnect(
    folly::exception_wrapper ew) {
  if (!stateMachine_) {
    return folly::makeFuture<folly::Unit>(
        std::runtime_error{"RSocketClient must always have a state machine"});
  }

  auto work = [sm = stateMachine_, e = std::move(ew)]() mutable {
    sm->disconnect(std::move(e));
  };

  if (evb_->isInEventBaseThread()) {
    VLOG(2) << "Running RSocketClient disconnect synchronously";
    work();
    return folly::unit;
  }

  VLOG(2) << "Scheduling RSocketClient disconnect";
  return folly::via(evb_, work);
}

void RSocketClient::fromConnection(
    std::unique_ptr<DuplexConnection> connection,
    folly::EventBase& transportEvb,
    SetupParameters params) {
  if (!evb_) {
    // If no EventBase is given for the stateMachine, then use the transport's
    // EventBase to drive the stateMachine.
    evb_ = &transportEvb;
  }
  createState();

  std::unique_ptr<DuplexConnection> framed;
  if (connection->isFramed()) {
    framed = std::move(connection);
  } else {
    framed = std::make_unique<FramedDuplexConnection>(
        std::move(connection), params.protocolVersion);
  }
  auto transport = std::make_shared<FrameTransportImpl>(std::move(framed));

  if (evb_ == &transportEvb) {
    stateMachine_->connectClient(std::move(transport), std::move(params));
    return;
  }

  // If the StateMachine EventBase is different from the transport EventBase,
  // then use ScheduledFrameTransport and ScheduledFrameProcessor to ensure the
  // RSocketStateMachine and Transport live on the desired EventBases.
  auto scheduledFT = std::make_shared<ScheduledFrameTransport>(
      std::move(transport), &transportEvb, evb_);
  evb_->runInEventBaseThread([stateMachine = stateMachine_,
                              scheduledFT = std::move(scheduledFT),
                              params = std::move(params)]() mutable {
    stateMachine->connectClient(std::move(scheduledFT), std::move(params));
  });
}

void RSocketClient::createState() {
  // Creation of state is permitted only once for each RSocketClient.
  // When evb is removed from RSocketStateMachine, the state can be
  // created in constructor
  CHECK(!stateMachine_) << "A stateMachine has already been created";

  if (!responder_) {
    responder_ = std::make_shared<RSocketResponder>();
  }

  std::unique_ptr<KeepaliveTimer> keepaliveTimer{nullptr};
  if (keepaliveInterval_ > std::chrono::milliseconds(0)) {
    keepaliveTimer =
        std::make_unique<KeepaliveTimer>(keepaliveInterval_, *evb_);
  }

  stateMachine_ = std::make_shared<RSocketStateMachine>(
      std::move(responder_),
      std::move(keepaliveTimer),
      RSocketMode::CLIENT,
      std::move(stats_),
      std::move(connectionEvents_),
      std::move(resumeManager_),
      std::move(coldResumeHandler_));

  requester_ = std::make_shared<RSocketRequester>(stateMachine_, *evb_);
}

} // namespace rsocket
