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

namespace folly {
class EventBase;
}

namespace rsocket {

//
// A decorated RSocketResponder object which schedules the calls from
// application code to RSocket on the provided EventBase
//
class ScheduledRSocketResponder : public RSocketResponder {
 public:
  ScheduledRSocketResponder(
      std::shared_ptr<RSocketResponder> inner,
      folly::EventBase& eventBase);

  std::shared_ptr<yarpl::single::Single<Payload>> handleRequestResponse(
      Payload request,
      StreamId streamId) override;

  std::shared_ptr<yarpl::flowable::Flowable<Payload>> handleRequestStream(
      Payload request,
      StreamId streamId) override;

  std::shared_ptr<yarpl::flowable::Flowable<Payload>> handleRequestChannel(
      Payload request,
      std::shared_ptr<yarpl::flowable::Flowable<Payload>> requestStream,
      StreamId streamId) override;

  void handleFireAndForget(Payload request, StreamId streamId) override;

 private:
  const std::shared_ptr<RSocketResponder> inner_;
  folly::EventBase& eventBase_;
};

} // namespace rsocket
