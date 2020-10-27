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

#include "rsocket/framing/ScheduledFrameTransport.h"

#include "rsocket/framing/ScheduledFrameProcessor.h"

namespace rsocket {

ScheduledFrameTransport::~ScheduledFrameTransport() = default;

void ScheduledFrameTransport::setFrameProcessor(
    std::shared_ptr<FrameProcessor> fp) {
  CHECK(frameTransport_) << "Inner transport already closed";

  transportEvb_->runInEventBaseThread([stateMachineEvb = stateMachineEvb_,
                                       transport = frameTransport_,
                                       fp = std::move(fp)]() mutable {
    auto scheduledFP = std::make_shared<ScheduledFrameProcessor>(
        std::move(fp), stateMachineEvb);
    transport->setFrameProcessor(std::move(scheduledFP));
  });
}

void ScheduledFrameTransport::outputFrameOrDrop(
    std::unique_ptr<folly::IOBuf> ioBuf) {
  CHECK(frameTransport_) << "Inner transport already closed";

  transportEvb_->runInEventBaseThread(
      [transport = frameTransport_, buf = std::move(ioBuf)]() mutable {
        transport->outputFrameOrDrop(std::move(buf));
      });
}

void ScheduledFrameTransport::close() {
  CHECK(frameTransport_) << "Inner transport already closed";

  transportEvb_->runInEventBaseThread(
      [transport = std::move(frameTransport_)]() { transport->close(); });
}

bool ScheduledFrameTransport::isConnectionFramed() const {
  CHECK(frameTransport_) << "Inner transport already closed";
  return frameTransport_->isConnectionFramed();
}

} // namespace rsocket
