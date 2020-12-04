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

#include <folly/Optional.h>
#include <unordered_map>
#include "rsocket/framing/Frame.h"
#include "rsocket/framing/FrameTransportImpl.h"

namespace folly {
class IOBuf;
}

namespace rsocket {

// Struct to hold information relevant per stream.
struct StreamResumeInfo {
  StreamResumeInfo() = delete;
  StreamResumeInfo(StreamType sType, RequestOriginator req, std::string sToken)
      : streamType(sType), requester(req), streamToken(sToken) {}

  // REQUEST_STREAM, REQUEST_CHANNEL or REQUEST_RESPONSE.  We don't
  // have to store any stream level information for FNF.
  StreamType streamType;

  // Did the stream originate locally or remotely.
  RequestOriginator requester;

  // Application defined string representation for the stream.
  std::string streamToken;

  // Stores the allowance which the local side has received but hasn't
  // fulfilled yet.  Relevant for REQUEST_STREAM Responder and REQUEST_CHANNEL
  size_t producerAllowance{0};

  // Stores the allowance which has been sent to the remote side and has not
  // been fulfilled yet.  Relevant for REQUEST_STREAM Requester and
  // REQUEST_CHANNEL
  size_t consumerAllowance{0};
};

using StreamResumeInfos = std::unordered_map<StreamId, StreamResumeInfo>;

// Applications desiring to have cold-resumption should implement a
// ResumeManager interface.  By default, an in-memory implementation of this
// interface (WarmResumeManager) will be used by RSocket.
//
// The API refers to the stored frames by "position".  "position" is the byte
// count at frame boundaries.  For example, if the ResumeManager has stored 3
// 100-byte sent frames starting from byte count 150.  Then,
// - isPositionAvailable would return true for the values [150, 250, 350].
// - firstSentPosition() would return 150
// - lastSentPosition() would return 350
class ResumeManager {
 public:
  static std::shared_ptr<ResumeManager> makeEmpty();

  virtual ~ResumeManager() {}

  // The following methods will be called for each frame which is being
  // sent/received on the wire.  The application should implement a way to
  // store the sent and received frames in persistent storage.
  virtual void trackReceivedFrame(
      size_t frameLength,
      FrameType frameType,
      StreamId streamId,
      size_t consumerAllowance) = 0;

  virtual void trackSentFrame(
      const folly::IOBuf& serializedFrame,
      FrameType frameType,
      StreamId streamId,
      size_t consumerAllowance) = 0;

  // We have received acknowledgement from the remote-side that it has frames
  // up to "position".  We can discard all frames before that.  This
  // information is periodically received from remote-side through KeepAlive
  // frames.
  virtual void resetUpToPosition(ResumePosition position) = 0;

  // The application should check its persistent storage and respond whether it
  // has frames starting from "position" in send buffer.
  virtual bool isPositionAvailable(ResumePosition position) const = 0;

  // The application should send frames starting from the "position" using the
  // provided "transport".  As an alternative, we could design the API such
  // that we retrieve individual frames from the application and send them over
  // wire.  But that would mean application has random access to frames
  // indexed by position.  This API gives the flexibility to the application to
  // store the frames in any way it wants (randomly accessed or sequentially
  // accessed).
  virtual void sendFramesFromPosition(
      ResumePosition position,
      FrameTransport& transport) const = 0;

  // This should return the first (oldest) available position in the send
  // buffer.
  virtual ResumePosition firstSentPosition() const = 0;

  // This should return the last (latest) available position in the send
  // buffer.
  virtual ResumePosition lastSentPosition() const = 0;

  // This should return the latest tracked position of frames received from
  // remote side.
  virtual ResumePosition impliedPosition() const = 0;

  // This gets called when a stream is opened (both local/remote streams)
  virtual void onStreamOpen(
      StreamId,
      RequestOriginator,
      std::string streamToken,
      StreamType streamType) = 0;

  // This gets called when a stream is closed (both local/remote streams)
  virtual void onStreamClosed(StreamId streamId) = 0;

  // Returns the cached stream information.
  virtual const StreamResumeInfos& getStreamResumeInfos() const = 0;

  // Returns the largest used StreamId so far.
  virtual StreamId getLargestUsedStreamId() const = 0;

  // Utility method to check frames which should be tracked for resumption.
  virtual bool shouldTrackFrame(const FrameType frameType) const {
    switch (frameType) {
      case FrameType::REQUEST_CHANNEL:
      case FrameType::REQUEST_STREAM:
      case FrameType::REQUEST_RESPONSE:
      case FrameType::REQUEST_FNF:
      case FrameType::REQUEST_N:
      case FrameType::CANCEL:
      case FrameType::ERROR:
      case FrameType::PAYLOAD:
        return true;
      case FrameType::RESERVED:
      case FrameType::SETUP:
      case FrameType::LEASE:
      case FrameType::KEEPALIVE:
      case FrameType::METADATA_PUSH:
      case FrameType::RESUME:
      case FrameType::RESUME_OK:
      case FrameType::EXT:
      default:
        return false;
    }
  }
};
} // namespace rsocket
