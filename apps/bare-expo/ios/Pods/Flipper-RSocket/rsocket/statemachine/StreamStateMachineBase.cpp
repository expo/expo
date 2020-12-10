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

#include "rsocket/statemachine/StreamStateMachineBase.h"
#include <folly/io/IOBuf.h>
#include "rsocket/statemachine/RSocketStateMachine.h"
#include "rsocket/statemachine/StreamsWriter.h"

namespace rsocket {

void StreamStateMachineBase::handleRequestN(uint32_t) {
  VLOG(4) << "Unexpected handleRequestN";
}

void StreamStateMachineBase::handleError(folly::exception_wrapper) {
  endStream(StreamCompletionSignal::ERROR);
  removeFromWriter();
}

void StreamStateMachineBase::handleCancel() {
  VLOG(4) << "Unexpected handleCancel";
}

size_t StreamStateMachineBase::getConsumerAllowance() const {
  return 0;
}

void StreamStateMachineBase::newStream(
    StreamType streamType,
    uint32_t initialRequestN,
    Payload payload) {
  writer_->writeNewStream(
      streamId_, streamType, initialRequestN, std::move(payload));
}

void StreamStateMachineBase::writeRequestN(uint32_t n) {
  writer_->writeRequestN(Frame_REQUEST_N{streamId_, n});
}

void StreamStateMachineBase::writeCancel() {
  writer_->writeCancel(Frame_CANCEL{streamId_});
}

void StreamStateMachineBase::writePayload(Payload&& payload, bool complete) {
  auto const flags =
      FrameFlags::NEXT | (complete ? FrameFlags::COMPLETE : FrameFlags::EMPTY_);
  Frame_PAYLOAD frame{streamId_, flags, std::move(payload)};
  writer_->writePayload(std::move(frame));
}

void StreamStateMachineBase::writeComplete() {
  writer_->writePayload(Frame_PAYLOAD::complete(streamId_));
}

void StreamStateMachineBase::writeApplicationError(folly::StringPiece msg) {
  writer_->writeError(Frame_ERROR::applicationError(streamId_, msg));
}

void StreamStateMachineBase::writeApplicationError(Payload&& payload) {
  writer_->writeError(
      Frame_ERROR::applicationError(streamId_, std::move(payload)));
}

void StreamStateMachineBase::writeInvalidError(folly::StringPiece msg) {
  writer_->writeError(Frame_ERROR::invalid(streamId_, msg));
}

void StreamStateMachineBase::removeFromWriter() {
  writer_->onStreamClosed(streamId_);
  // TODO: set writer_ to nullptr
}

std::shared_ptr<yarpl::flowable::Subscriber<Payload>>
StreamStateMachineBase::onNewStreamReady(
    StreamType streamType,
    Payload payload,
    std::shared_ptr<yarpl::flowable::Subscriber<Payload>> response) {
  return writer_->onNewStreamReady(
      streamId_, streamType, std::move(payload), std::move(response));
}

void StreamStateMachineBase::onNewStreamReady(
    StreamType streamType,
    Payload payload,
    std::shared_ptr<yarpl::single::SingleObserver<Payload>> response) {
  writer_->onNewStreamReady(
      streamId_, streamType, std::move(payload), std::move(response));
}
} // namespace rsocket
