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

#include "rsocket/internal/WarmResumeManager.h"

#include <algorithm>

namespace rsocket {

WarmResumeManager::~WarmResumeManager() {
  clearFrames(lastSentPosition_);
}

void WarmResumeManager::trackReceivedFrame(
    size_t frameLength,
    FrameType frameType,
    StreamId streamId,
    size_t consumerAllowance) {
  if (shouldTrackFrame(frameType)) {
    VLOG(6) << "Track received frame " << frameType << " StreamId: " << streamId
            << " Allowance: " << consumerAllowance;
    impliedPosition_ += frameLength;
  }
}

void WarmResumeManager::trackSentFrame(
    const folly::IOBuf& serializedFrame,
    FrameType frameType,
    StreamId,
    size_t consumerAllowance) {
  if (shouldTrackFrame(frameType)) {
    // TODO(tmont): this could be expensive, find a better way to get length
    const auto frameDataLength = serializedFrame.computeChainDataLength();

    VLOG(6) << "Track sent frame " << frameType
            << " Allowance: " << consumerAllowance;
    // If the frame is too huge, we don't cache it.
    // We empty the entire cache instead.
    if (frameDataLength > capacity_) {
      resetUpToPosition(lastSentPosition_);
      lastSentPosition_ += frameDataLength;
      firstSentPosition_ += frameDataLength;
      DCHECK(firstSentPosition_ == lastSentPosition_);
      DCHECK(size_ == 0);
      return;
    }

    addFrame(serializedFrame, frameDataLength);
    lastSentPosition_ += frameDataLength;
  }
}

void WarmResumeManager::resetUpToPosition(ResumePosition position) {
  if (position <= firstSentPosition_) {
    return;
  }

  if (position > lastSentPosition_) {
    position = lastSentPosition_;
  }

  clearFrames(position);

  firstSentPosition_ = position;
  DCHECK(frames_.empty() || frames_.front().first == firstSentPosition_);
}

bool WarmResumeManager::isPositionAvailable(ResumePosition position) const {
  return (lastSentPosition_ == position) ||
      std::binary_search(
             frames_.begin(),
             frames_.end(),
             std::make_pair(position, std::unique_ptr<folly::IOBuf>()),
             [](decltype(frames_.back()) pairA,
                decltype(frames_.back()) pairB) {
               return pairA.first < pairB.first;
             });
}

void WarmResumeManager::addFrame(
    const folly::IOBuf& frame,
    size_t frameDataLength) {
  size_ += frameDataLength;
  while (size_ > capacity_) {
    evictFrame();
  }
  frames_.emplace_back(lastSentPosition_, frame.clone());
  stats_->resumeBufferChanged(1, static_cast<int>(frameDataLength));
}

void WarmResumeManager::evictFrame() {
  DCHECK(!frames_.empty());

  const auto position = frames_.size() > 1 ? std::next(frames_.begin())->first
                                           : lastSentPosition_;
  resetUpToPosition(position);
}

void WarmResumeManager::clearFrames(ResumePosition position) {
  if (frames_.empty()) {
    return;
  }
  DCHECK(position <= lastSentPosition_);
  DCHECK(position >= firstSentPosition_);

  const auto end = std::lower_bound(
      frames_.begin(),
      frames_.end(),
      position,
      [](decltype(frames_.back()) pair, ResumePosition pos) {
        return pair.first < pos;
      });
  DCHECK(end == frames_.end() || end->first >= firstSentPosition_);
  const auto pos = end == frames_.end() ? position : end->first;
  stats_->resumeBufferChanged(
      -static_cast<int>(std::distance(frames_.begin(), end)),
      -static_cast<int>(pos - firstSentPosition_));

  frames_.erase(frames_.begin(), end);
  size_ -= static_cast<decltype(size_)>(pos - firstSentPosition_);
}

void WarmResumeManager::sendFramesFromPosition(
    ResumePosition position,
    FrameTransport& frameTransport) const {
  DCHECK(isPositionAvailable(position));

  if (position == lastSentPosition_) {
    // idle resumption
    return;
  }

  auto found = std::lower_bound(
      frames_.begin(),
      frames_.end(),
      position,
      [](decltype(frames_.back()) pair, ResumePosition pos) {
        return pair.first < pos;
      });

  DCHECK(found != frames_.end());
  DCHECK(found->first == position);

  while (found != frames_.end()) {
    frameTransport.outputFrameOrDrop(found->second->clone());
    found++;
  }
}

std::shared_ptr<ResumeManager> ResumeManager::makeEmpty() {
  class Empty : public WarmResumeManager {
   public:
    Empty() : WarmResumeManager(nullptr, 0) {}
    bool shouldTrackFrame(FrameType) const override {
      return false;
    }
  };

  return std::make_shared<Empty>();
}

} // namespace rsocket
