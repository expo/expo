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

#include "rsocket/statemachine/ChannelRequester.h"

namespace rsocket {

void ChannelRequester::onSubscribe(
    std::shared_ptr<yarpl::flowable::Subscription> subscription) {
  CHECK(!requested_);
  publisherSubscribe(std::move(subscription));

  if (hasInitialRequest_) {
    initStream(std::move(request_));
  }
}

void ChannelRequester::onNext(Payload request) {
  if (!requested_) {
    initStream(std::move(request));
    return;
  }

  if (!publisherClosed()) {
    writePayload(std::move(request));
  }
}

// TODO: consolidate code in onCompleteImpl, onErrorImpl, cancelImpl
void ChannelRequester::onComplete() {
  if (!requested_) {
    endStream(StreamCompletionSignal::CANCEL);
    removeFromWriter();
    return;
  }
  if (!publisherClosed()) {
    publisherComplete();
    writeComplete();
    tryCompleteChannel();
  }
}

void ChannelRequester::onError(folly::exception_wrapper ex) {
  if (!requested_) {
    endStream(StreamCompletionSignal::CANCEL);
    removeFromWriter();
    return;
  }
  if (!publisherClosed()) {
    publisherComplete();
    endStream(StreamCompletionSignal::ERROR);
    writeApplicationError(ex.get_exception()->what());
    tryCompleteChannel();
  }
}

void ChannelRequester::request(int64_t n) {
  if (!requested_) {
    // The initial request has not been sent out yet, hence we must accumulate
    // the unsynchronised allowance, portion of which will be sent out with
    // the initial request frame, and the rest will be dispatched via
    // ConsumerBase:request (ultimately by sending REQUEST_N frames).
    initialResponseAllowance_.add(n);
    return;
  }
  ConsumerBase::generateRequest(n);
}

void ChannelRequester::cancel() {
  if (!requested_) {
    endStream(StreamCompletionSignal::CANCEL);
    removeFromWriter();
    return;
  }
  cancelConsumer();
  writeCancel();
  tryCompleteChannel();
}

void ChannelRequester::handlePayload(
    Payload&& payload,
    bool flagsComplete,
    bool flagsNext,
    bool flagsFollows) {
  CHECK(requested_);
  bool finalComplete = processFragmentedPayload(
      std::move(payload), flagsNext, flagsComplete, flagsFollows);

  if (finalComplete) {
    completeConsumer();
    tryCompleteChannel();
  }
}

void ChannelRequester::handleRequestN(uint32_t n) {
  CHECK(requested_);
  PublisherBase::processRequestN(n);
}

void ChannelRequester::handleError(folly::exception_wrapper ew) {
  CHECK(requested_);
  errorConsumer(std::move(ew));
  terminatePublisher();
}

void ChannelRequester::handleCancel() {
  CHECK(requested_);
  terminatePublisher();
  tryCompleteChannel();
}

void ChannelRequester::endStream(StreamCompletionSignal signal) {
  terminatePublisher();
  ConsumerBase::endStream(signal);
}

void ChannelRequester::initStream(Payload&& request) {
  requested_ = true;

  const size_t initialN = initialResponseAllowance_.consumeUpTo(kMaxRequestN);
  const size_t remainingN = initialResponseAllowance_.consumeAll();

  // Send as much as possible with the initial request.
  CHECK_GE(kMaxRequestN, initialN);
  newStream(
      StreamType::CHANNEL, static_cast<uint32_t>(initialN), std::move(request));
  // We must inform ConsumerBase about an implicit allowance we have
  // requested from the remote end.
  ConsumerBase::addImplicitAllowance(initialN);
  // Pump the remaining allowance into the ConsumerBase _after_ sending the
  // initial request.
  if (remainingN) {
    ConsumerBase::generateRequest(remainingN);
  }
}

void ChannelRequester::tryCompleteChannel() {
  if (publisherClosed() && consumerClosed()) {
    endStream(StreamCompletionSignal::COMPLETE);
    removeFromWriter();
  }
}

} // namespace rsocket
