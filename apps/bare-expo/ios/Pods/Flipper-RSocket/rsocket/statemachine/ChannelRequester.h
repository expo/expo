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
#include "rsocket/statemachine/ConsumerBase.h"
#include "rsocket/statemachine/PublisherBase.h"
#include "yarpl/flowable/Subscriber.h"

namespace rsocket {

/// Implementation of stream stateMachine that represents a Channel requester.
class ChannelRequester : public ConsumerBase,
                         public PublisherBase,
                         public yarpl::flowable::Subscriber<Payload> {
 public:
  ChannelRequester(
      Payload request,
      std::shared_ptr<StreamsWriter> writer,
      StreamId streamId)
      : ConsumerBase(std::move(writer), streamId),
        PublisherBase(0 /*initialRequestN*/),
        request_(std::move(request)),
        hasInitialRequest_(true) {}

  ChannelRequester(std::shared_ptr<StreamsWriter> writer, StreamId streamId)
      : ConsumerBase(std::move(writer), streamId),
        PublisherBase(1 /*initialRequestN*/) {}

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
  void initStream(Payload&&);
  void tryCompleteChannel();

  /// An allowance accumulated before the stream is initialised.  Remaining part
  /// of the allowance is forwarded to the ConsumerBase.
  Allowance initialResponseAllowance_;

  Payload request_;
  bool requested_{false};
  bool hasInitialRequest_{false};
};

} // namespace rsocket
