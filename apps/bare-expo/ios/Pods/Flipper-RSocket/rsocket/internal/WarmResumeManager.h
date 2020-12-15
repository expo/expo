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

#include <folly/lang/Assume.h>

#include "rsocket/RSocketStats.h"
#include "rsocket/ResumeManager.h"

namespace folly {
class IOBuf;
}

namespace rsocket {

class RSocketStateMachine;
class FrameTransport;

class WarmResumeManager : public ResumeManager {
 public:
  explicit WarmResumeManager(
      std::shared_ptr<RSocketStats> stats,
      size_t capacity = DEFAULT_CAPACITY)
      : stats_(std::move(stats)), capacity_(capacity) {}
  ~WarmResumeManager();

  void trackReceivedFrame(
      size_t frameLength,
      FrameType frameType,
      StreamId streamId,
      size_t consumerAllowance) override;

  void trackSentFrame(
      const folly::IOBuf& serializedFrame,
      FrameType frameType,
      StreamId streamId,
      size_t consumerAllowance) override;

  void resetUpToPosition(ResumePosition position) override;

  bool isPositionAvailable(ResumePosition position) const override;

  void sendFramesFromPosition(
      ResumePosition position,
      FrameTransport& transport) const override;

  ResumePosition firstSentPosition() const override {
    return firstSentPosition_;
  }

  ResumePosition lastSentPosition() const override {
    return lastSentPosition_;
  }

  ResumePosition impliedPosition() const override {
    return impliedPosition_;
  }

  // No action to perform for WarmResumeManager
  void onStreamOpen(StreamId, RequestOriginator, std::string, StreamType)
      override {}

  // No action to perform for WarmResumeManager
  void onStreamClosed(StreamId) override {}

  const StreamResumeInfos& getStreamResumeInfos() const override {
    LOG(FATAL) << "Not Implemented for Warm Resumption";
    folly::assume_unreachable();
  }

  StreamId getLargestUsedStreamId() const override {
    LOG(FATAL) << "Not Implemented for Warm Resumption";
    folly::assume_unreachable();
  }

  size_t size() const {
    return size_;
  }

 protected:
  void addFrame(const folly::IOBuf&, size_t);
  void evictFrame();

  // Called before clearing cached frames to update stats.
  void clearFrames(ResumePosition position);

  const std::shared_ptr<RSocketStats> stats_;

  // Start position of the send buffer queue
  ResumePosition firstSentPosition_{0};
  // End position of the send buffer queue
  ResumePosition lastSentPosition_{0};
  // Inferred position of the rcvd frames
  ResumePosition impliedPosition_{0};

  std::deque<std::pair<ResumePosition, std::unique_ptr<folly::IOBuf>>> frames_;

  constexpr static size_t DEFAULT_CAPACITY = 1024 * 1024; // 1MB
  const size_t capacity_;
  size_t size_{0};
};
} // namespace rsocket
