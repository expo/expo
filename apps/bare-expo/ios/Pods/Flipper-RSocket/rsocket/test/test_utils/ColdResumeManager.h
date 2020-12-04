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

#include "rsocket/internal/WarmResumeManager.h"

namespace folly {
class IOBuf;
}

namespace rsocket {

class RSocketStateMachine;
class FrameTransport;

// In-memory ResumeManager for cold-resumption (for prototyping and
// testing purposes)
class ColdResumeManager : public WarmResumeManager {
 public:
  // If inputFile is provided, the ColdResumeManager will read state from the
  // file, else it will start with a clean state.
  // The constructor will throw if there is an error reading from the inputFile.
  ColdResumeManager(
      std::shared_ptr<RSocketStats> stats,
      std::string inputFile = "");

  void trackReceivedFrame(
      size_t frameLength,
      FrameType frameType,
      StreamId streamId,
      size_t consumerAllowance) override;

  void trackSentFrame(
      const folly::IOBuf& serializedFrame,
      FrameType frameType,
      StreamId streamIdPtr,
      size_t consumerAllowance) override;

  void onStreamOpen(
      StreamId,
      RequestOriginator,
      std::string streamToken,
      StreamType) override;

  void onStreamClosed(StreamId streamId) override;

  const StreamResumeInfos& getStreamResumeInfos() const override {
    return streamResumeInfos_;
  }

  StreamId getLargestUsedStreamId() const override {
    return largestUsedStreamId_;
  }

  // Persist resumption state to outputFile.  Will throw if write fails.
  void persistState(std::string outputFile);

 private:
  StreamResumeInfos streamResumeInfos_;

  // Largest used StreamId so far.
  StreamId largestUsedStreamId_{0};
};
} // namespace rsocket
