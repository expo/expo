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

#include <gmock/gmock.h>

#include "rsocket/RSocketStats.h"
#include "rsocket/framing/FrameSerializer_v1_0.h"
#include "rsocket/statemachine/StreamsWriter.h"

namespace rsocket {

class MockStreamsWriterImpl : public StreamsWriterImpl {
 public:
  MOCK_METHOD1(onStreamClosed, void(StreamId));
  MOCK_METHOD1(outputFrame_, void(folly::IOBuf*));
  MOCK_METHOD0(shouldQueue, bool());

  MockStreamsWriterImpl() {
    using namespace testing;
    ON_CALL(*this, shouldQueue()).WillByDefault(Invoke([this]() {
      return this->shouldQueue_;
    }));
  }

  void outputFrame(std::unique_ptr<folly::IOBuf> buf) override {
    outputFrame_(buf.get());
  }

  FrameSerializer& serializer() override {
    return frameSerializer;
  }

  RSocketStats& stats() override {
    return *stats_;
  }

  std::shared_ptr<yarpl::flowable::Subscriber<Payload>> onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) override {
    // ignoring...
    return nullptr;
  }

  void onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>> response)
      override {
    // ignoring...
  }

  using StreamsWriterImpl::sendPendingFrames;

  bool shouldQueue_{false};
  std::shared_ptr<RSocketStats> stats_ = RSocketStats::noop();
  FrameSerializerV1_0 frameSerializer;
};

class MockStreamsWriter : public StreamsWriter {
 public:
  MOCK_METHOD4(writeNewStream_, void(StreamId, StreamType, uint32_t, Payload&));
  MOCK_METHOD1(writeRequestN_, void(rsocket::Frame_REQUEST_N));
  MOCK_METHOD1(writeCancel_, void(rsocket::Frame_CANCEL));
  MOCK_METHOD1(writePayload_, void(rsocket::Frame_PAYLOAD&));
  MOCK_METHOD1(writeError_, void(rsocket::Frame_ERROR&));
  MOCK_METHOD1(onStreamClosed, void(rsocket::StreamId));

  // Delegate the Mock calls to the implementation in StreamsWriterImpl.
  MockStreamsWriterImpl& delegateToImpl() {
    delegateToImpl_ = true;
    using namespace testing;
    ON_CALL(*this, onStreamClosed(_))
        .WillByDefault(Invoke(&impl_, &StreamsWriter::onStreamClosed));
    return impl_;
  }

  void writeNewStream(StreamId id, StreamType type, uint32_t i, Payload p)
      override {
    writeNewStream_(id, type, i, p);
    if (delegateToImpl_) {
      impl_.writeNewStream(id, type, i, std::move(p));
    }
  }

  void writeRequestN(rsocket::Frame_REQUEST_N&& request) override {
    if (delegateToImpl_) {
      impl_.writeRequestN(std::move(request));
    }
    writeRequestN_(request);
  }

  void writeCancel(rsocket::Frame_CANCEL&& cancel) override {
    writeCancel_(cancel);
    if (delegateToImpl_) {
      impl_.writeCancel(std::move(cancel));
    }
  }

  void writePayload(rsocket::Frame_PAYLOAD&& payload) override {
    writePayload_(payload);
    if (delegateToImpl_) {
      impl_.writePayload(std::move(payload));
    }
  }

  void writeError(rsocket::Frame_ERROR&& error) override {
    writeError_(error);
    if (delegateToImpl_) {
      impl_.writeError(std::move(error));
    }
  }

  std::shared_ptr<yarpl::flowable::Subscriber<Payload>> onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) override {
    // ignoring...
    return nullptr;
  }

  void onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>> response)
      override {
    // ignoring...
  }

 protected:
  MockStreamsWriterImpl impl_;
  bool delegateToImpl_{false};
};

} // namespace rsocket
