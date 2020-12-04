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

#include "rsocket/internal/SetupResumeAcceptor.h"

#include <folly/ExceptionWrapper.h>
#include <folly/io/async/EventBase.h>

#include "rsocket/framing/Frame.h"
#include "rsocket/framing/FrameProcessor.h"
#include "rsocket/framing/FrameSerializer.h"

namespace rsocket {

/// Subscriber that owns a connection, sets itself as that connection's input,
/// and reads out a single frame before cancelling.
class SetupResumeAcceptor::OneFrameSubscriber final
    : public yarpl::flowable::BaseSubscriber<std::unique_ptr<folly::IOBuf>> {
 public:
  OneFrameSubscriber(
      SetupResumeAcceptor& acceptor,
      std::unique_ptr<DuplexConnection> connection,
      SetupResumeAcceptor::OnSetup onSetup,
      SetupResumeAcceptor::OnResume onResume)
      : acceptor_{acceptor},
        connection_{std::move(connection)},
        onSetup_{std::move(onSetup)},
        onResume_{std::move(onResume)} {
    DCHECK(connection_);
    DCHECK(onSetup_);
    DCHECK(onResume_);
    DCHECK(acceptor_.inOwnerThread());
  }

  void setInput() {
    DCHECK(acceptor_.inOwnerThread());
    connection_->setInput(ref_from_this(this));
  }

  /// Shut down the DuplexConnection, breaking the cycle between it and this
  /// subscriber.  Expects the DuplexConnection's destructor to call
  /// onComplete/onError on its input subscriber (this).
  void close() {
    auto self = ref_from_this(this);
    connection_.reset();
  }

  void onSubscribeImpl() override {
    DCHECK(acceptor_.inOwnerThread());
    this->request(1);
  }

  void onNextImpl(std::unique_ptr<folly::IOBuf> buf) override {
    DCHECK(connection_) << "OneFrameSubscriber received more than one frame";
    DCHECK(acceptor_.inOwnerThread());

    this->cancel(); // calls onTerminateImpl

    acceptor_.processFrame(
        std::move(connection_),
        std::move(buf),
        std::move(onSetup_),
        std::move(onResume_));
  }

  void onCompleteImpl() override {}
  void onErrorImpl(folly::exception_wrapper) override {}

  void onTerminateImpl() override {
    DCHECK(acceptor_.inOwnerThread());
    acceptor_.remove(ref_from_this(this));
  }

 private:
  SetupResumeAcceptor& acceptor_;
  std::unique_ptr<DuplexConnection> connection_;
  SetupResumeAcceptor::OnSetup onSetup_;
  SetupResumeAcceptor::OnResume onResume_;
};

SetupResumeAcceptor::SetupResumeAcceptor(folly::EventBase* eventBase)
    : eventBase_{eventBase} {
  CHECK(eventBase_);
}

SetupResumeAcceptor::~SetupResumeAcceptor() {
  close().get();
}

void SetupResumeAcceptor::processFrame(
    std::unique_ptr<DuplexConnection> connection,
    std::unique_ptr<folly::IOBuf> buf,
    SetupResumeAcceptor::OnSetup onSetup,
    SetupResumeAcceptor::OnResume onResume) {
  DCHECK(inOwnerThread());
  DCHECK(connection);

  if (closed_) {
    return;
  }

  const auto serializer = FrameSerializer::createAutodetectedSerializer(*buf);
  if (!serializer) {
    VLOG(2) << "Unable to detect protocol version";
    return;
  }

  switch (serializer->peekFrameType(*buf)) {
    case FrameType::SETUP: {
      Frame_SETUP frame;
      if (!serializer->deserializeFrom(frame, std::move(buf))) {
        constexpr auto msg = "Cannot decode SETUP frame";
        auto err = serializer->serializeOut(Frame_ERROR::connectionError(msg));
        connection->send(std::move(err));
        break;
      }

      VLOG(3) << "In: " << frame;

      SetupParameters params;
      frame.moveToSetupPayload(params);

      if (serializer->protocolVersion() != params.protocolVersion) {
        constexpr auto msg = "SETUP frame has invalid protocol version";
        auto err = serializer->serializeOut(Frame_ERROR::invalidSetup(msg));
        connection->send(std::move(err));
        break;
      }

      onSetup(std::move(connection), std::move(params));
      break;
    }

    case FrameType::RESUME: {
      Frame_RESUME frame;
      if (!serializer->deserializeFrom(frame, std::move(buf))) {
        constexpr auto msg = "Cannot decode RESUME frame";
        auto err = serializer->serializeOut(Frame_ERROR::connectionError(msg));
        connection->send(std::move(err));
        break;
      }

      VLOG(3) << "In: " << frame;

      ResumeParameters params(
          std::move(frame.token_),
          frame.lastReceivedServerPosition_,
          frame.clientPosition_,
          ProtocolVersion(frame.versionMajor_, frame.versionMinor_));

      if (serializer->protocolVersion() != params.protocolVersion) {
        constexpr auto msg = "RESUME frame has invalid protocol version";
        auto err = serializer->serializeOut(Frame_ERROR::rejectedResume(msg));
        connection->send(std::move(err));
        break;
      }

      onResume(std::move(connection), std::move(params));
      break;
    }

    default: {
      constexpr auto msg = "Invalid frame, expected SETUP/RESUME";
      auto err = serializer->serializeOut(Frame_ERROR::connectionError(msg));
      connection->send(std::move(err));
      break;
    }
  }
}

void SetupResumeAcceptor::accept(
    std::unique_ptr<DuplexConnection> connection,
    OnSetup onSetup,
    OnResume onResume) {
  DCHECK(inOwnerThread());

  if (closed_) {
    return;
  }

  const auto subscriber = std::make_shared<OneFrameSubscriber>(
      *this, std::move(connection), std::move(onSetup), std::move(onResume));
  connections_.insert(subscriber);
  subscriber->setInput();
}

void SetupResumeAcceptor::remove(
    const std::shared_ptr<SetupResumeAcceptor::OneFrameSubscriber>&
        subscriber) {
  DCHECK(inOwnerThread());
  connections_.erase(subscriber);
}

folly::Future<folly::Unit> SetupResumeAcceptor::close() {
  if (inOwnerThread()) {
    closeAll();
    return folly::makeFuture();
  }
  return folly::via(eventBase_, [this] { closeAll(); });
}

void SetupResumeAcceptor::closeAll() {
  DCHECK(inOwnerThread());

  closed_ = true;

  auto connections = std::move(connections_);
  for (auto& connection : connections) {
    connection->close();
  }
}

bool SetupResumeAcceptor::inOwnerThread() const {
  return eventBase_->isInEventBaseThread();
}

} // namespace rsocket
