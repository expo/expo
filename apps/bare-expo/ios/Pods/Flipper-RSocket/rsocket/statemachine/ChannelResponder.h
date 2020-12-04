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

#include "rsocket/statemachine/ConsumerBase.h"
#include "rsocket/statemachine/PublisherBase.h"
#include "yarpl/flowable/Subscriber.h"

namespace rsocket {

/// Implementation of stream stateMachine that represents a Channel responder.
class ChannelResponder : public ConsumerBase,
                         public PublisherBase,
                         public yarpl::flowable::Subscriber<Payload> {
 public:
  ChannelResponder(
      std::shared_ptr<StreamsWriter> writer,
      StreamId streamId,
      uint32_t initialRequestN)
      : ConsumerBase(std::move(writer), streamId),
        PublisherBase(initialRequestN) {}

  void onSubscribe(std::shared_ptr<yarpl::flowable::Subscription>) override;
  void onNext(Payload) override;
  void onComplete() override;
  void onError(folly::exception_wrapper) override;

  void request(int64_t) override;
  void cancel() override;

  void handlePayload(
      Payload&& payload,
      bool flagsComplete,
      bool flagsNext,
      bool flagsFollows) override;

  void handleRequestN(uint32_t) override;
  void handleError(folly::exception_wrapper) override;
  void handleCancel() override;

  void endStream(StreamCompletionSignal) override;

 private:
  void tryCompleteChannel();

  bool newStream_{true};
};

} // namespace rsocket
