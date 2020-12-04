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

#include "rsocket/framing/ScheduledFrameProcessor.h"

namespace rsocket {

ScheduledFrameProcessor::ScheduledFrameProcessor(
    std::shared_ptr<FrameProcessor> processor,
    folly::EventBase* evb)
    : evb_{evb}, processor_{std::move(processor)} {}

ScheduledFrameProcessor::~ScheduledFrameProcessor() = default;

void ScheduledFrameProcessor::processFrame(
    std::unique_ptr<folly::IOBuf> ioBuf) {
  CHECK(processor_) << "Calling processFrame() after onTerminal()";

  evb_->runInEventBaseThread(
      [processor = processor_, buf = std::move(ioBuf)]() mutable {
        processor->processFrame(std::move(buf));
      });
}

void ScheduledFrameProcessor::onTerminal(folly::exception_wrapper ew) {
  evb_->runInEventBaseThread(
      [e = std::move(ew), processor = std::move(processor_)]() mutable {
        processor->onTerminal(std::move(e));
      });
}

} // namespace rsocket
