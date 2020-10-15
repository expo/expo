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
#include "rsocket/statemachine/StreamStateMachineBase.h"
#include "yarpl/single/SingleObserver.h"
#include "yarpl/single/SingleSubscription.h"

namespace rsocket {

/// Implementation of stream stateMachine that represents a RequestResponse
/// requester
class RequestResponseRequester
    : public StreamStateMachineBase,
      public yarpl::single::SingleSubscription,
      public std::enable_shared_from_this<RequestResponseRequester> {
 public:
  RequestResponseRequester(
      std::shared_ptr<StreamsWriter> writer,
      StreamId streamId,
      Payload payload)
      : StreamStateMachineBase(std::move(writer), streamId),
        initialPayload_(std::move(payload)) {}

  void subscribe(
      std::shared_ptr<yarpl::single::SingleObserver<Payload>> subscriber);

 private:
  void cancel() noexcept override;

  void handlePayload(
      Payload&& payload,
      bool flagsComplete,
      bool flagsNext,
      bool flagsFollows) override;
  void handleError(folly::exception_wrapper ew) override;

  void endStream(StreamCompletionSignal signal) override;

  size_t getConsumerAllowance() const override;

  /// State of the Subscription requester.
  enum class State : uint8_t {
    NEW,
    REQUESTED,
    CLOSED,
  };

  State state_{State::NEW};

  /// The observer that will consume payloads.
  std::shared_ptr<yarpl::single::SingleObserver<Payload>> consumingSubscriber_;

  /// Initial payload which has to be sent with 1st request.
  Payload initialPayload_;
};
} // namespace rsocket
