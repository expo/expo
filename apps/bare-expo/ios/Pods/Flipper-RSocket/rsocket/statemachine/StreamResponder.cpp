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

#include "rsocket/statemachine/StreamResponder.h"

namespace rsocket {

void StreamResponder::onSubscribe(
    std::shared_ptr<yarpl::flowable::Subscription> subscription) {
  publisherSubscribe(std::move(subscription));
}

void StreamResponder::onNext(Payload response) {
  if (publisherClosed()) {
    return;
  }
  writePayload(std::move(response));
}

void StreamResponder::onComplete() {
  if (publisherClosed()) {
    return;
  }
  publisherComplete();
  writeComplete();
  removeFromWriter();
}

void StreamResponder::onError(folly::exception_wrapper ew) {
  if (publisherClosed()) {
    return;
  }
  publisherComplete();
  if (!ew.with_exception([this](rsocket::ErrorWithPayload& err) {
        writeApplicationError(std::move(err.payload));
      })) {
    writeApplicationError(ew.get_exception()->what());
  }
  removeFromWriter();
}

void StreamResponder::handleRequestN(uint32_t n) {
  processRequestN(n);
}

void StreamResponder::handleError(folly::exception_wrapper) {
  handleCancel();
}

void StreamResponder::handlePayload(
    Payload&& payload,
    bool /*flagsComplete*/,
    bool /*flagsNext*/,
    bool flagsFollows) {
  payloadFragments_.addPayloadIgnoreFlags(std::move(payload));

  if (flagsFollows) {
    // there will be more fragments to come
    return;
  }

  Payload finalPayload = payloadFragments_.consumePayloadIgnoreFlags();

  if (newStream_) {
    newStream_ = false;
    onNewStreamReady(
        StreamType::STREAM, std::move(finalPayload), shared_from_this());
  } else {
    // per rsocket spec, ignore unexpected frame (payload) if it makes no sense
    // in the semantic of the stream
  }
}

void StreamResponder::handleCancel() {
  if (publisherClosed()) {
    return;
  }
  terminatePublisher();
  removeFromWriter();
}

void StreamResponder::endStream(StreamCompletionSignal signal) {
  if (publisherClosed()) {
    return;
  }
  terminatePublisher();
  writeApplicationError(to_string(signal));
  removeFromWriter();
}

} // namespace rsocket
