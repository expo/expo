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

#include "rsocket/statemachine/ChannelResponder.h"

namespace rsocket {

void ChannelResponder::onSubscribe(
    std::shared_ptr<yarpl::flowable::Subscription> subscription) {
  publisherSubscribe(std::move(subscription));
}

void ChannelResponder::onNext(Payload response) {
  if (!publisherClosed()) {
    writePayload(std::move(response));
  }
}

void ChannelResponder::onComplete() {
  if (!publisherClosed()) {
    publisherComplete();
    writeComplete();
    tryCompleteChannel();
  }
}

void ChannelResponder::onError(folly::exception_wrapper ex) {
  if (!publisherClosed()) {
    publisherComplete();
    endStream(StreamCompletionSignal::ERROR);
    if (!ex.with_exception([this](rsocket::ErrorWithPayload& err) {
          writeApplicationError(std::move(err.payload));
        })) {
      writeApplicationError(ex.get_exception()->what());
    }
    tryCompleteChannel();
  }
}

void ChannelResponder::request(int64_t n) {
  ConsumerBase::generateRequest(n);
}

void ChannelResponder::cancel() {
  cancelConsumer();
  writeCancel();
  tryCompleteChannel();
}

void ChannelResponder::handlePayload(
    Payload&& payload,
    bool flagsComplete,
    bool flagsNext,
    bool flagsFollows) {
  payloadFragments_.addPayload(std::move(payload), flagsNext, flagsComplete);

  if (flagsFollows) {
    // there will be more fragments to come
    return;
  }

  bool finalFlagsComplete, finalFlagsNext;
  Payload finalPayload;

  std::tie(finalPayload, finalFlagsNext, finalFlagsComplete) =
      payloadFragments_.consumePayloadAndFlags();

  if (newStream_) {
    newStream_ = false;
    auto channelOutputSubscriber = onNewStreamReady(
        StreamType::CHANNEL,
        std::move(finalPayload),
        std::static_pointer_cast<ChannelResponder>(shared_from_this()));
    subscribe(std::move(channelOutputSubscriber));
  } else {
    processPayload(std::move(finalPayload), finalFlagsNext);
  }

  if (finalFlagsComplete) {
    completeConsumer();
    tryCompleteChannel();
  }
}

void ChannelResponder::handleRequestN(uint32_t n) {
  processRequestN(n);
}

void ChannelResponder::handleError(folly::exception_wrapper ew) {
  errorConsumer(std::move(ew));
  terminatePublisher();
}

void ChannelResponder::handleCancel() {
  terminatePublisher();
  tryCompleteChannel();
}

void ChannelResponder::endStream(StreamCompletionSignal signal) {
  terminatePublisher();
  ConsumerBase::endStream(signal);
}

void ChannelResponder::tryCompleteChannel() {
  if (publisherClosed() && consumerClosed()) {
    endStream(StreamCompletionSignal::COMPLETE);
    removeFromWriter();
  }
}

} // namespace rsocket
