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
/// responder
class RequestResponseResponder
    : public StreamStateMachineBase,
      public yarpl::single::SingleObserver<Payload>,
      public std::enable_shared_from_this<RequestResponseResponder> {
 public:
  RequestResponseResponder(
      std::shared_ptr<StreamsWriter> writer,
      StreamId streamId)
      : StreamStateMachineBase(std::move(writer), streamId) {}

  void onSubscribe(std::shared_ptr<yarpl::single::SingleSubscription>) override;
  void onSuccess(Payload) override;
  void onError(folly::exception_wrapper) override;

  void handlePayload(
      Payload&& payload,
      bool flagsComplete,
      bool flagsNext,
      bool flagsFollows) override;
  void handleCancel() override;

  void endStream(StreamCompletionSignal) override;

 private:
  /// State of the Subscription responder.
  enum class State : uint8_t {
    NEW,
    RESPONDING,
    CLOSED,
  };

  std::shared_ptr<yarpl::single::SingleSubscription> producingSubscription_;
  State state_{State::NEW};
};

} // namespace rsocket
