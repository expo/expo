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

#include <folly/io/async/EventBase.h>

#include "rsocket/framing/FrameProcessor.h"

namespace rsocket {

// This class is a wrapper around FrameProcessor which ensures all methods of
// FrameProcessor get executed in a particular EventBase.
//
// This is currently used in the server where the resumed Transport of the
// client is on a different EventBase compared to the EventBase on which the
// original RSocketStateMachine was constructed for the client.  Here the
// transport uses this class to schedule events of the RSocketStateMachine
// (FrameProcessor) in the original EventBase.
class ScheduledFrameProcessor : public FrameProcessor {
 public:
  ScheduledFrameProcessor(std::shared_ptr<FrameProcessor>, folly::EventBase*);
  ~ScheduledFrameProcessor();

  void processFrame(std::unique_ptr<folly::IOBuf>) override;
  void onTerminal(folly::exception_wrapper) override;

 private:
  folly::EventBase* const evb_;
  std::shared_ptr<FrameProcessor> processor_;
};

} // namespace rsocket
