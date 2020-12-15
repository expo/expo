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

#include <yarpl/Flowable.h>
#include <yarpl/Single.h>
#include "rsocket/Payload.h"
#include "rsocket/framing/Frame.h"
#include "rsocket/framing/FrameType.h"
#include "rsocket/internal/Common.h"

namespace rsocket {

class RSocketStats;
class FrameSerializer;

/// The interface for writing stream related frames on the wire.
class StreamsWriter {
 public:
  virtual ~StreamsWriter() = default;

  virtual void writeNewStream(
      StreamId streamId,
      StreamType streamType,
      uint32_t initialRequestN,
      Payload payload) = 0;

  virtual void writeRequestN(Frame_REQUEST_N&&) = 0;
  virtual void writeCancel(Frame_CANCEL&&) = 0;

  virtual void writePayload(Frame_PAYLOAD&&) = 0;
  virtual void writeError(Frame_ERROR&&) = 0;

  virtual void onStreamClosed(StreamId) = 0;

  virtual std::shared_ptr<yarpl::flowable::Subscriber<Payload>>
  onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) = 0;
  virtual void onNewStreamReady(
      StreamId streamId,
      StreamType streamType,
      Payload payload,
      std::shared_ptr<yarpl::single::SingleObserver<Payload>> response) = 0;
};

class StreamsWriterImpl : public StreamsWriter {
 public:
  void writeNewStream(
      StreamId streamId,
      StreamType streamType,
      uint32_t initialRequestN,
      Payload payload) override;

  void writeRequestN(Frame_REQUEST_N&&) override;
  void writeCancel(Frame_CANCEL&&) override;

  void writePayload(Frame_PAYLOAD&&) override;

  // TODO: writeFragmentedError
  void writeError(Frame_ERROR&&) override;

 protected:
  // note: onStreamClosed() method is also still pure
  virtual void outputFrame(std::unique_ptr<folly::IOBuf>) = 0;
  virtual FrameSerializer& serializer() = 0;
  virtual RSocketStats& stats() = 0;
  virtual bool shouldQueue() = 0;

  template <typename WriteInitialFrame>
  void writeFragmented(
      WriteInitialFrame,
      StreamId const,
      FrameFlags const,
      Payload payload);

  /// Send a frame to the output, or queue it if shouldQueue()
  virtual void sendPendingFrames();
  void outputFrameOrEnqueue(std::unique_ptr<folly::IOBuf>);
  void enqueuePendingOutputFrame(std::unique_ptr<folly::IOBuf> frame);
  std::deque<std::unique_ptr<folly::IOBuf>> consumePendingOutputFrames();

 private:
  /// A queue of frames that are slated to be sent out.
  std::deque<std::unique_ptr<folly::IOBuf>> pendingOutputFrames_;

  /// The byte size of all pending output frames.
  size_t pendingSize_{0};
};

} // namespace rsocket
