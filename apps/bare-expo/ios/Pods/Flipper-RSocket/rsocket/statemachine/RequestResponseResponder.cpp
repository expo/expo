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

#include "rsocket/statemachine/RequestResponseResponder.h"

namespace rsocket {

void RequestResponseResponder::onSubscribe(
    std::shared_ptr<yarpl::single::SingleSubscription> subscription) {
  DCHECK(State::NEW != state_);
  if (state_ == State::CLOSED) {
    subscription->cancel();
    return;
  }
  producingSubscription_ = std::move(subscription);
}

void RequestResponseResponder::onSuccess(Payload response) {
  DCHECK(State::NEW != state_);
  if (!producingSubscription_) {
    return;
  }

  switch (state_) {
    case State::RESPONDING: {
      state_ = State::CLOSED;
      writePayload(std::move(response), true /* complete */);
      producingSubscription_ = nullptr;
      removeFromWriter();
      break;
    }
    case State::CLOSED:
      break;

    case State::NEW:
    default:
      // class is internally misused
      CHECK(false);
  }
}

void RequestResponseResponder::onError(folly::exception_wrapper ex) {
  DCHECK(State::NEW != state_);
  producingSubscription_ = nullptr;
  switch (state_) {
    case State::RESPONDING: {
      state_ = State::CLOSED;
      if (!ex.with_exception([this](rsocket::ErrorWithPayload& err) {
            writeApplicationError(std::move(err.payload));
          })) {
        writeApplicationError(ex.get_exception()->what());
      }
      removeFromWriter();
    } break;
    case State::CLOSED:
      break;

    case State::NEW:
    default:
      // class is internally misused
      CHECK(false);
  }
}

void RequestResponseResponder::handleCancel() {
  switch (state_) {
    case State::RESPONDING:
      state_ = State::CLOSED;
      removeFromWriter();
      break;
    case State::NEW:
    case State::CLOSED:
      break;
  }
}

void RequestResponseResponder::handlePayload(
    Payload&& payload,
    bool /*flagsComplete*/,
    bool /*flagsNext*/,
    bool flagsFollows) {
  payloadFragments_.addPayloadIgnoreFlags(std::move(payload));

  if (flagsFollows) {
    // there will be more fragments to come
    return;
  }

  CHECK(state_ == State::NEW);
  Payload finalPayload = payloadFragments_.consumePayloadIgnoreFlags();

  state_ = State::RESPONDING;
  onNewStreamReady(
      StreamType::REQUEST_RESPONSE,
      std::move(finalPayload),
      shared_from_this());
}

void RequestResponseResponder::endStream(StreamCompletionSignal signal) {
  switch (state_) {
    case State::NEW:
    case State::RESPONDING:
      // Spontaneous ::endStream signal means an error.
      DCHECK(StreamCompletionSignal::COMPLETE != signal);
      DCHECK(StreamCompletionSignal::CANCEL != signal);
      state_ = State::CLOSED;
      break;
    case State::CLOSED:
      break;
  }
  if (auto subscription = std::move(producingSubscription_)) {
    subscription->cancel();
  }
}

} // namespace rsocket
