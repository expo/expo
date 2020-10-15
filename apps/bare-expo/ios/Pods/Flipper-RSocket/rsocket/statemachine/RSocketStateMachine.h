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

#include <deque>
#include <memory>

#include "rsocket/ColdResumeHandler.h"
#include "rsocket/DuplexConnection.h"
#include "rsocket/Payload.h"
#include "rsocket/RSocketParameters.h"
#include "rsocket/ResumeManager.h"
#include "rsocket/framing/FrameProcessor.h"
#include "rsocket/framing/FrameSerializer.h"
#include "rsocket/internal/Common.h"
#include "rsocket/internal/KeepaliveTimer.h"
#include "rsocket/statemachine/StreamFragmentAccumulator.h"
#include "rsocket/statemachine/StreamStateMachineBase.h"
#include "rsocket/statemachine/StreamsWriter.h"
#include "yarpl/flowable/Subscriber.h"
#include "yarpl/flowable/Subscription.h"
#include "yarpl/single/SingleObserver.h"

namespace rsocket {

class ClientResumeStatusCallback;
class DuplexConnection;
class FrameTransport;
class Frame_ERROR;
class KeepaliveTimer;
class RSocketConnectionEvents;
class RSocketParameters;
class RSocketResponder;
class RSocketResponderCore;
class RSocketStateMachine;
class RSocketStats;
class ResumeManager;
class RSocketStateMachineTest;

class FrameSink {
 public:
  virtual ~FrameSink() = default;

  /// Terminates underlying connection sending the error frame
  /// on the connection.
  ///
  /// This may synchronously deliver terminal signals to all
  /// StreamAutomatonBase attached to this ConnectionAutomaton.
  virtual void disconnectOrCloseWithError(Frame_ERROR&& error) = 0;

  virtual void sendKeepalive(
      std::unique_ptr<folly::IOBuf> data = folly::IOBuf::create(0)) = 0;
};

/// Handles connection-level frames and (de)multiplexes streams.
///
/// Instances of this class should be accessed and managed via shared_ptr,
/// instead of the pattern reflected in MemoryMixin and IntrusiveDeleter.
/// The reason why such a simple memory management story is possible lies in the
/// fact that there is no request(n)-based flow control between stream
/// automata and ConnectionAutomaton.
class RSocketStateMachine final
    : public FrameSink,
      public FrameProcessor,
      public StreamsWriterImpl,
      public std::enable_shared_from_this<RSocketStateMachine> {
 public:
  RSocketStateMachine(
      std::shared_ptr<RSocketResponderCore> requestResponder,
      std::unique_ptr<KeepaliveTimer> keepaliveTimer,
      RSocketMode mode,
      std::shared_ptr<RSocketStats> stats,
      std::shared_ptr<RSocketConnectionEvents> connectionEvents,
      std::shared_ptr<ResumeManager> resumeManager,
      std::shared_ptr<ColdResumeHandler> coldResumeHandler);

  RSocketStateMachine(
      std::shared_ptr<RSocketResponder> requestResponder,
      std::unique_ptr<KeepaliveTimer> keepaliveTimer,
      RSocketMode mode,
      std::shared_ptr<RSocketStats> stats,
      std::shared_ptr<RSocketConnectionEvents> connectionEvents,
      std::shared_ptr<ResumeManager> resumeManager,
      std::shared_ptr<ColdResumeHandler> coldResumeHandler);

  ~RSocketStateMachine();

  /// Create a new connection as a server.
  void connectServer(std::shared_ptr<FrameTransport>, const SetupParameters&);

  /// Resume a connection as a server.
  bool resumeServer(std::shared_ptr<FrameTransport>, const ResumeParameters&);

  /// Connect as a client.  Sends a SETUP frame.
  void connectClient(std::shared_ptr<FrameTransport>, SetupParameters);

  /// Resume a connection as a client.  Sends a RESUME frame.
  void resumeClient(
      ResumeIdentificationToken,
      std::shared_ptr<FrameTransport>,
      std::unique_ptr<ClientResumeStatusCallback>,
      ProtocolVersion);

  /// Disconnect the state machine's connection.  Existing streams will stay
  /// intact.
  void disconnect(folly::exception_wrapper);

  /// Whether the connection has been disconnected or closed.
  bool isDisconnected() const;

  /// Send an ERROR frame, and close the connection and all of its streams.
  void closeWithError(Frame_ERROR&&);

  /// Disconnect the connection if it is resumable, otherwise send an ERROR
  /// frame and close the connection and all of its streams.
  void disconnectOrCloseWithError(Frame_ERROR&&) override;

  /// Close the connection and all of its streams.
  void close(folly::exception_wrapper, StreamCompletionSignal);

  void requestStream(
      Payload request,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> responseSink);

  std::shared_ptr<yarpl::flowable::Subscriber<Payload>> requestChannel(
      Payload request,
      bool hasInitialRequest,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> responseSink);

  void requestResponse(
      Payload payload,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>> responseSink);

  /// Send a REQUEST_FNF frame.
  void fireAndForget(Payload);

  /// Send a METADATA_PUSH frame.
  void metadataPush(std::unique_ptr<folly::IOBuf>);

  /// Send a KEEPALIVE frame, with the RESPOND flag set.
  void sendKeepalive(std::unique_ptr<folly::IOBuf>) override;

  class CloseCallback {
   public:
    virtual ~CloseCallback() = default;
    virtual void remove(RSocketStateMachine&) = 0;
  };

  /// Register a callback to be called when the StateMachine is closed.
  /// It will be used to inform the containers, i.e. ConnectionSet or
  /// wangle::ConnectionManager, to don't store the StateMachine anymore.
  void registerCloseCallback(CloseCallback* callback);

  DuplexConnection* getConnection();

  // Has active requests?
  bool hasStreams() const;

 private:
  // connection scope signals
  void onKeepAliveFrame(
      ResumePosition resumePosition,
      std::unique_ptr<folly::IOBuf> data,
      bool keepAliveRespond);
  void onMetadataPushFrame(std::unique_ptr<folly::IOBuf> metadata);
  void onResumeOkFrame(ResumePosition resumePosition);
  void onErrorFrame(StreamId streamId, ErrorCode errorCode, Payload payload);

  // stream scope signals
  void onRequestNFrame(StreamId streamId, uint32_t requestN);
  void onCancelFrame(StreamId streamId);
  void onPayloadFrame(
      StreamId streamId,
      Payload payload,
      bool flagsFollows,
      bool flagsComplete,
      bool flagsNext);

  void onRequestStreamFrame(
      StreamId streamId,
      uint32_t requestN,
      Payload payload,
      bool flagsFollows);
  void onRequestChannelFrame(
      StreamId streamId,
      uint32_t requestN,
      Payload payload,
      bool flagsComplete,
      bool flagsNext,
      bool flagsFollows);
  void
  onRequestResponseFrame(StreamId streamId, Payload payload, bool flagsFollows);
  void
  onFireAndForgetFrame(StreamId streamId, Payload payload, bool flagsFollows);
  void onSetupFrame();
  void onResumeFrame();
  void onReservedFrame();
  void onLeaseFrame();
  void onExtFrame();
  void onUnexpectedFrame(StreamId streamId);

  std::shared_ptr<StreamStateMachineBase> getStreamStateMachine(
      StreamId streamId);

  void connect(std::shared_ptr<FrameTransport>);

  /// Terminate underlying connection and connect new connection
  void reconnect(
      std::shared_ptr<FrameTransport>,
      std::unique_ptr<ClientResumeStatusCallback>);

  void setResumable(bool);

  bool resumeFromPositionOrClose(
      ResumePosition serverPosition,
      ResumePosition clientPosition);

  bool isPositionAvailable(ResumePosition) const;

  /// Whether the connection has been closed.
  bool isClosed() const;

  uint32_t getKeepaliveTime() const;

  void sendPendingFrames() override;

  // Should buffer the frame if the state machine is disconnected or in the
  // process of resuming.
  bool shouldQueue() override;
  RSocketStats& stats() override {
    return *stats_;
  }

  FrameSerializer& serializer() override {
    return *frameSerializer_;
  }

  template <typename TFrame>
  bool deserializeFrameOrError(
      TFrame& frame,
      std::unique_ptr<folly::IOBuf> buf) {
    if (frameSerializer_->deserializeFrom(frame, std::move(buf))) {
      return true;
    }
    closeWithError(Frame_ERROR::connectionError("Invalid frame"));
    return false;
  }

  // FrameProcessor.
  void processFrame(std::unique_ptr<folly::IOBuf>) override;
  void onTerminal(folly::exception_wrapper) override;

  void handleFrame(StreamId, FrameType, std::unique_ptr<folly::IOBuf>);

  void closeStreams(StreamCompletionSignal);
  void closeFrameTransport(folly::exception_wrapper);

  void sendKeepalive(FrameFlags, std::unique_ptr<folly::IOBuf>);

  void resumeFromPosition(ResumePosition);
  void outputFrame(std::unique_ptr<folly::IOBuf>) override;

  void writeNewStream(
      StreamId streamId,
      StreamType streamType,
      uint32_t initialRequestN,
      Payload payload) override;

  std::shared_ptr<yarpl::flowable::Subscriber<Payload>> onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) override;
  void onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>> response)
      override;

  void onStreamClosed(StreamId) override;

  bool ensureOrAutodetectFrameSerializer(const folly::IOBuf& firstFrame);
  bool ensureNotInResumption();

  size_t getConsumerAllowance(StreamId) const;

  void setProtocolVersionOrThrow(
      ProtocolVersion version,
      const std::shared_ptr<FrameTransport>& transport);

  bool isNewStreamId(StreamId streamId);
  bool registerNewPeerStreamId(StreamId streamId);
  StreamId getNextStreamId();

  void setNextStreamId(StreamId streamId);

  /// Client/server mode this state machine is operating in.
  const RSocketMode mode_;

  /// Whether the connection was initialized as resumable.
  bool isResumable_{false};

  /// Whether the connection has closed.
  bool isClosed_{false};

  /// Whether a cold resume is currently in progress.
  bool coldResumeInProgress_{false};

  std::shared_ptr<RSocketStats> stats_;

  /// Map of all individual stream state machines.
  std::unordered_map<StreamId, std::shared_ptr<StreamStateMachineBase>>
      streams_;
  StreamId nextStreamId_;
  StreamId lastPeerStreamId_{0};

  // Manages all state needed for warm/cold resumption.
  std::shared_ptr<ResumeManager> resumeManager_;

  const std::shared_ptr<RSocketResponderCore> requestResponder_;
  std::shared_ptr<FrameTransport> frameTransport_;
  std::unique_ptr<FrameSerializer> frameSerializer_;

  const std::unique_ptr<KeepaliveTimer> keepaliveTimer_;

  std::unique_ptr<ClientResumeStatusCallback> resumeCallback_;
  std::shared_ptr<ColdResumeHandler> coldResumeHandler_;

  std::shared_ptr<RSocketConnectionEvents> connectionEvents_;

  CloseCallback* closeCallback_{nullptr};

  friend class RSocketStateMachineTest;
};

} // namespace rsocket
