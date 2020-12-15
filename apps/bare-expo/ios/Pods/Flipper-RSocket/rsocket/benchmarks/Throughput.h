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

#include "rsocket/RSocketResponder.h"
#include "rsocket/benchmarks/Latch.h"

namespace rsocket {

/// Responder that always sends back a fixed message.
class FixedResponder : public RSocketResponder {
 public:
  explicit FixedResponder(const std::string& message)
      : message_{folly::IOBuf::copyBuffer(message)} {}

  /// Infinitely streams back the message.
  std::shared_ptr<yarpl::flowable::Flowable<Payload>> handleRequestStream(
      Payload,
      StreamId) override {
    return yarpl::flowable::Flowable<Payload>::fromGenerator(
        [msg = message_->clone()] { return Payload(msg->clone()); });
  }

  std::shared_ptr<yarpl::single::Single<Payload>> handleRequestResponse(
      Payload,
      StreamId) override {
    return yarpl::single::Singles::fromGenerator<Payload>(
        [msg = message_->clone()] { return Payload(msg->clone()); });
  }

 private:
  std::unique_ptr<folly::IOBuf> message_;
};

/// Subscriber that requests N items and cancels the subscription once all of
/// them arrive.  Signals a latch when it terminates.
class BoundedSubscriber : public yarpl::flowable::BaseSubscriber<Payload> {
 public:
  BoundedSubscriber(Latch& latch, size_t requested)
      : latch_{latch}, requested_{requested} {}

  void onSubscribeImpl() override {
    this->request(requested_);
  }

  void onNextImpl(Payload) override {
    if (received_.fetch_add(1) == requested_ - 1) {
      DCHECK(!terminated_.exchange(true));
      latch_.post();

      // After this cancel we could be destroyed.
      this->cancel();
    }
  }

  void onCompleteImpl() override {
    if (!terminated_.exchange(true)) {
      latch_.post();
    }
  }

  void onErrorImpl(folly::exception_wrapper) override {
    if (!terminated_.exchange(true)) {
      latch_.post();
    }
  }

 private:
  Latch& latch_;

  std::atomic_bool terminated_{false};
  size_t requested_{0};
  std::atomic<size_t> received_{0};
};
} // namespace rsocket
