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

#include "rsocket/RSocketServer.h"
#include <folly/io/async/EventBaseManager.h>

#include <rsocket/internal/ScheduledRSocketResponder.h>
#include "rsocket/RSocketErrors.h"
#include "rsocket/RSocketStats.h"
#include "rsocket/framing/FramedDuplexConnection.h"
#include "rsocket/framing/ScheduledFrameTransport.h"
#include "rsocket/internal/ConnectionSet.h"
#include "rsocket/internal/WarmResumeManager.h"

namespace rsocket {

RSocketServer::RSocketServer(
    std::unique_ptr<ConnectionAcceptor> connectionAcceptor,
    std::shared_ptr<RSocketStats> stats)
    : duplexConnectionAcceptor_(std::move(connectionAcceptor)),
      setupResumeAcceptors_([] {
        return new rsocket::SetupResumeAcceptor{
            folly::EventBaseManager::get()->getExistingEventBase()};
      }),
      connectionSet_(std::make_unique<ConnectionSet>()),
      stats_(std::move(stats)) {}

RSocketServer::~RSocketServer() {
  VLOG(3) << "~RSocketServer ..";
  shutdownAndWait();
}

void RSocketServer::shutdownAndWait() {
  if (isShutdown_) {
    return;
  }

  // Will stop forwarding connections from duplexConnectionAcceptor_ to
  // setupResumeAcceptors_
  isShutdown_ = true;

  // Stop accepting new connections.
  if (duplexConnectionAcceptor_) {
    duplexConnectionAcceptor_->stop();
  }

  std::vector<folly::Future<folly::Unit>> closingFutures;
  for (auto& acceptor : setupResumeAcceptors_.accessAllThreads()) {
    // This call will queue up the cleanup on the eventBase.
    closingFutures.push_back(acceptor.close());
  }

  folly::collectAllSemiFuture(closingFutures).get();

  // Close off all outstanding connections.
  connectionSet_->shutdownAndWait();
}

void RSocketServer::start(
    std::shared_ptr<RSocketServiceHandler> serviceHandler) {
  CHECK(duplexConnectionAcceptor_); // RSocketServer has to be initialized with
  // the acceptor

  if (started) {
    throw std::runtime_error("RSocketServer::start() already called.");
  }
  started = true;

  duplexConnectionAcceptor_->start(
      [this, serviceHandler](
          std::unique_ptr<DuplexConnection> connection,
          folly::EventBase& eventBase) {
        acceptConnection(std::move(connection), eventBase, serviceHandler);
      });
}

void RSocketServer::start(OnNewSetupFn onNewSetupFn) {
  start(RSocketServiceHandler::create(std::move(onNewSetupFn)));
}

void RSocketServer::startAndPark(OnNewSetupFn onNewSetupFn) {
  startAndPark(RSocketServiceHandler::create(std::move(onNewSetupFn)));
}

void RSocketServer::setSingleThreadedResponder() {
  useScheduledResponder_ = false;
}

void RSocketServer::acceptConnection(
    std::unique_ptr<DuplexConnection> connection,
    folly::EventBase&,
    std::shared_ptr<RSocketServiceHandler> serviceHandler) {
  stats_->serverConnectionAccepted();
  if (isShutdown_) {
    // connection is getting out of scope and terminated
    return;
  }

  std::unique_ptr<DuplexConnection> framedConnection;
  if (connection->isFramed()) {
    framedConnection = std::move(connection);
  } else {
    framedConnection = std::make_unique<FramedDuplexConnection>(
        std::move(connection), ProtocolVersion::Unknown);
  }

  auto* acceptor = setupResumeAcceptors_.get();

  VLOG(2) << "Going to accept duplex connection";

  acceptor->accept(
      std::move(framedConnection),
      [serviceHandler,
       weakConSet = std::weak_ptr<ConnectionSet>(connectionSet_),
       scheduledResponder = useScheduledResponder_](
          std::unique_ptr<DuplexConnection> conn,
          SetupParameters params) mutable {
        if (auto connectionSet = weakConSet.lock()) {
          RSocketServer::onRSocketSetup(
              serviceHandler,
              std::move(connectionSet),
              scheduledResponder,
              std::move(conn),
              std::move(params));
        }
      },
      std::bind(
          &RSocketServer::onRSocketResume,
          this,
          serviceHandler,
          std::placeholders::_1,
          std::placeholders::_2));
}

void RSocketServer::onRSocketSetup(
    std::shared_ptr<RSocketServiceHandler> serviceHandler,
    std::shared_ptr<ConnectionSet> connectionSet,
    bool scheduledResponder,
    std::unique_ptr<DuplexConnection> connection,
    SetupParameters setupParams) {
  const auto eventBase = folly::EventBaseManager::get()->getExistingEventBase();
  VLOG(2) << "Received new setup payload on " << eventBase->getName();
  CHECK(eventBase);
  auto result = serviceHandler->onNewSetup(setupParams);
  if (result.hasError()) {
    VLOG(3) << "Terminating SETUP attempt from client. "
            << result.error().what();
    connection->send(
        FrameSerializer::createFrameSerializer(setupParams.protocolVersion)
            ->serializeOut(Frame_ERROR::rejectedSetup(result.error().what())));
    return;
  }
  auto connectionParams = std::move(result.value());
  if (!connectionParams.responder) {
    LOG(ERROR) << "Received invalid Responder. Dropping connection";
    connection->send(
        FrameSerializer::createFrameSerializer(setupParams.protocolVersion)
            ->serializeOut(Frame_ERROR::rejectedSetup(
                "Received invalid Responder from server")));
    return;
  }
  const auto rs = std::make_shared<RSocketStateMachine>(
      scheduledResponder
          ? std::make_shared<ScheduledRSocketResponder>(
                std::move(connectionParams.responder), *eventBase)
          : std::move(connectionParams.responder),
      nullptr,
      RSocketMode::SERVER,
      connectionParams.stats,
      std::move(connectionParams.connectionEvents),
      setupParams.resumable
          ? std::make_shared<WarmResumeManager>(connectionParams.stats)
          : ResumeManager::makeEmpty(),
      nullptr /* coldResumeHandler */);

  if (!connectionSet->insert(rs, eventBase)) {
    VLOG(1) << "Server is closed, so ignore the connection";
    connection->send(
        FrameSerializer::createFrameSerializer(setupParams.protocolVersion)
            ->serializeOut(Frame_ERROR::rejectedSetup(
                "Server ignores the connection attempt")));
    return;
  }
  rs->registerCloseCallback(connectionSet.get());

  auto requester = std::make_shared<RSocketRequester>(rs, *eventBase);
  auto serverState = std::shared_ptr<RSocketServerState>(
      new RSocketServerState(*eventBase, rs, std::move(requester)));
  serviceHandler->onNewRSocketState(std::move(serverState), setupParams.token);
  rs->connectServer(
      std::make_shared<FrameTransportImpl>(std::move(connection)),
      std::move(setupParams));
}

void RSocketServer::onRSocketResume(
    std::shared_ptr<RSocketServiceHandler> serviceHandler,
    std::unique_ptr<DuplexConnection> connection,
    ResumeParameters resumeParams) {
  auto result = serviceHandler->onResume(resumeParams.token);
  if (result.hasError()) {
    stats_->resumeFailedNoState();
    VLOG(3) << "Terminating RESUME attempt from client.  No ServerState found";
    connection->send(
        FrameSerializer::createFrameSerializer(resumeParams.protocolVersion)
            ->serializeOut(Frame_ERROR::rejectedSetup(result.error().what())));
    return;
  }
  const auto serverState = std::move(result.value());
  CHECK(serverState);
  const auto eventBase = folly::EventBaseManager::get()->getExistingEventBase();
  VLOG(2) << "Resuming client on " << eventBase->getName();
  if (!serverState->eventBase_.isInEventBaseThread()) {
    // If the resumed connection is on a different EventBase, then use
    // ScheduledFrameTransport and ScheduledFrameProcessor to ensure the
    // RSocketStateMachine continues to live on the same EventBase and the
    // IO happens in the new EventBase
    auto scheduledFT = std::make_shared<ScheduledFrameTransport>(
        std::make_shared<FrameTransportImpl>(std::move(connection)),
        eventBase, /* Transport EventBase */
        &serverState->eventBase_); /* StateMachine EventBase */
    serverState->eventBase_.runInEventBaseThread(
        [serverState,
         scheduledFT = std::move(scheduledFT),
         resumeParams = std::move(resumeParams)]() mutable {
          serverState->rSocketStateMachine_->resumeServer(
              std::move(scheduledFT), resumeParams);
        });
  } else {
    // If the resumed connection is on the same EventBase, then the
    // RSocketStateMachine and Transport can continue living in the same
    // EventBase without any thread hopping between them.
    serverState->rSocketStateMachine_->resumeServer(
        std::make_shared<FrameTransportImpl>(std::move(connection)),
        resumeParams);
  }
}

void RSocketServer::startAndPark(
    std::shared_ptr<RSocketServiceHandler> serviceHandler) {
  start(std::move(serviceHandler));
  waiting_.wait();
}

void RSocketServer::unpark() {
  waiting_.post();
}

folly::Optional<uint16_t> RSocketServer::listeningPort() const {
  return duplexConnectionAcceptor_ ? duplexConnectionAcceptor_->listeningPort()
                                   : folly::none;
}

size_t RSocketServer::getNumConnections() {
  return connectionSet_ ? connectionSet_->size() : 0;
}

} // namespace rsocket
