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

#include "rsocket/Payload.h"
#include "rsocket/internal/Allowance.h"
#include "rsocket/statemachine/StreamStateMachineBase.h"
#include "yarpl/flowable/Subscriber.h"
#include "yarpl/flowable/Subscription.h"

namespace rsocket {

/// A class that represents a flow-control-aware consumer of data.
class ConsumerBase : public StreamStateMachineBase,
                     public yarpl::flowable::Subscription,
                     public std::enable_shared_from_this<ConsumerBase> {
 public:
  using StreamStateMachineBase::StreamStateMachineBase;

  void subscribe(std::shared_ptr<yarpl::flowable::Subscriber<Payload>>);

  /// Adds implicit allowance.
  ///
  /// This portion of allowance will not be synced to the remote end, but will
  /// count towards the limit of allowance the remote PublisherBase may use.
  void addImplicitAllowance(size_t);

  void generateRequest(size_t);

  bool consumerClosed() const {
    return state_ == State::CLOSED;
  }

  size_t getConsumerAllowance() const override;
  void endStream(StreamCompletionSignal) override;

 protected:
  void processPayload(Payload&&, bool onNext);

  // returns true if the stream is completed
  bool
  processFragmentedPayload(Payload&&, bool next, bool complete, bool follows);

  void cancelConsumer();
  void completeConsumer();
  void errorConsumer(folly::exception_wrapper);

 private:
  enum class State : uint8_t {
    RESPONDING,
    CLOSED,
  };

  void sendRequests();

  void handleFlowControlError();

  /// A Subscriber that will consume payloads.  This is responsible for
  /// delivering a terminal signal to the Subscriber once the stream ends.
  std::shared_ptr<yarpl::flowable::Subscriber<Payload>> consumingSubscriber_;

  /// A total, net allowance (requested less delivered) by this consumer.
  Allowance allowance_;
  /// An allowance that have yet to be synced to the other end by sending
  /// REQUEST_N frames.
  Allowance pendingAllowance_;

  /// The number of already requested payload count.  Prevent excessive requestN
  /// calls.
  Allowance activeRequests_;

  State state_{State::RESPONDING};
};

} // namespace rsocket
