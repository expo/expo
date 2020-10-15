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

#include "rsocket/statemachine/RequestResponseRequester.h"

#include "rsocket/internal/Common.h"
#include "rsocket/statemachine/RSocketStateMachine.h"

namespace rsocket {

void RequestResponseRequester::subscribe(
    std::shared_ptr<yarpl::single::SingleObserver<Payload>> subscriber) {
  DCHECK(state_ != State::CLOSED);
  DCHECK(!consumingSubscriber_);
  consumingSubscriber_ = std::move(subscriber);
  consumingSubscriber_->onSubscribe(shared_from_this());

  if (state_ == State::NEW) {
    state_ = State::REQUESTED;
    newStream(StreamType::REQUEST_RESPONSE, 1, std::move(initialPayload_));
    return;
  }

  if (auto subscriber = std::move(consumingSubscriber_)) {
    subscriber->onError(std::runtime_error("cannot request more than 1 item"));
  }
  removeFromWriter();
}

void RequestResponseRequester::cancel() noexcept {
  consumingSubscriber_ = nullptr;
  switch (state_) {
    case State::NEW:
      state_ = State::CLOSED;
      removeFromWriter();
      break;
    case State::REQUESTED: {
      state_ = State::CLOSED;
      writeCancel();
      removeFromWriter();
    } break;
    case State::CLOSED:
      break;
  }
  consumingSubscriber_.reset();
}

void RequestResponseRequester::endStream(StreamCompletionSignal signal) {
  switch (state_) {
    case State::NEW:
    case State::REQUESTED:
      // Spontaneous ::endStream signal means an error.
      DCHECK(StreamCompletionSignal::COMPLETE != signal);
      DCHECK(StreamCompletionSignal::CANCEL != signal);
      state_ = State::CLOSED;
      break;
    case State::CLOSED:
      break;
  }
  if (auto subscriber = std::move(consumingSubscriber_)) {
    DCHECK(signal != StreamCompletionSignal::COMPLETE);
    DCHECK(signal != StreamCompletionSignal::CANCEL);
    subscriber->onError(StreamInterruptedException(static_cast<int>(signal)));
  }
}

void RequestResponseRequester::handleError(folly::exception_wrapper ew) {
  switch (state_) {
    case State::NEW:
      // Cannot receive a frame before sending the initial request.
      CHECK(false);
      break;
    case State::REQUESTED:
      state_ = State::CLOSED;
      if (auto subscriber = std::move(consumingSubscriber_)) {
        subscriber->onError(std::move(ew));
      }
      removeFromWriter();
      break;
    case State::CLOSED:
      break;
  }
}

void RequestResponseRequester::handlePayload(
    Payload&& payload,
    bool /*flagsComplete*/,
    bool flagsNext,
    bool flagsFollows) {
  // (State::NEW) Cannot receive a frame before sending the initial request.
  // (State::CLOSED) should not be receiving frames when closed
  // if we fail here, we broke some internal invariant of the class
  CHECK(state_ == State::REQUESTED);

  payloadFragments_.addPayload(std::move(payload), flagsNext, false);

  if (flagsFollows) {
    // there will be more fragments to come
    return;
  }

  bool finalFlagsNext, finalFlagsComplete;
  Payload finalPayload;

  std::tie(finalPayload, finalFlagsNext, finalFlagsComplete) =
      payloadFragments_.consumePayloadAndFlags();

  state_ = State::CLOSED;

  if (finalPayload || finalFlagsNext) {
    consumingSubscriber_->onSuccess(std::move(finalPayload));
    consumingSubscriber_ = nullptr;
  } else if (!finalFlagsComplete) {
    writeInvalidError("Payload, NEXT or COMPLETE flag expected");
    endStream(StreamCompletionSignal::ERROR);
  }
  removeFromWriter();
}

size_t RequestResponseRequester::getConsumerAllowance() const {
  return (state_ == State::REQUESTED) ? 1 : 0;
}

} // namespace rsocket
