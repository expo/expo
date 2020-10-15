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

#include "rsocket/internal/ScheduledRSocketResponder.h"

#include <folly/io/async/EventBase.h>

#include "rsocket/internal/ScheduledSingleObserver.h"
#include "rsocket/internal/ScheduledSubscriber.h"

namespace rsocket {

ScheduledRSocketResponder::ScheduledRSocketResponder(
    std::shared_ptr<RSocketResponder> inner,
    folly::EventBase& eventBase)
    : inner_(std::move(inner)), eventBase_(eventBase) {}

std::shared_ptr<yarpl::single::Single<Payload>>
ScheduledRSocketResponder::handleRequestResponse(
    Payload request,
    StreamId streamId) {
  auto innerFlowable =
      inner_->handleRequestResponse(std::move(request), streamId);
  return yarpl::single::Singles::create<Payload>(
      [innerFlowable = std::move(innerFlowable), eventBase = &eventBase_](
          std::shared_ptr<yarpl::single::SingleObserver<Payload>> observer) {
        innerFlowable->subscribe(
            std::make_shared<ScheduledSingleObserver<Payload>>(
                std::move(observer), *eventBase));
      });
}

std::shared_ptr<yarpl::flowable::Flowable<Payload>>
ScheduledRSocketResponder::handleRequestStream(
    Payload request,
    StreamId streamId) {
  auto innerFlowable =
      inner_->handleRequestStream(std::move(request), streamId);
  return yarpl::flowable::internal::flowableFromSubscriber<Payload>(
      [innerFlowable = std::move(innerFlowable), eventBase = &eventBase_](
          std::shared_ptr<yarpl::flowable::Subscriber<Payload>> subscriber) {
        innerFlowable->subscribe(std::make_shared<ScheduledSubscriber<Payload>>(
            std::move(subscriber), *eventBase));
      });
}

std::shared_ptr<yarpl::flowable::Flowable<Payload>>
ScheduledRSocketResponder::handleRequestChannel(
    Payload request,
    std::shared_ptr<yarpl::flowable::Flowable<Payload>> requestStream,
    StreamId streamId) {
  auto requestStreamFlowable =
      yarpl::flowable::internal::flowableFromSubscriber<Payload>(
          [requestStream = std::move(requestStream), eventBase = &eventBase_](
              std::shared_ptr<yarpl::flowable::Subscriber<Payload>>
                  subscriber) {
            requestStream->subscribe(
                std::make_shared<ScheduledSubscriptionSubscriber<Payload>>(
                    std::move(subscriber), *eventBase));
          });
  auto innerFlowable = inner_->handleRequestChannel(
      std::move(request), std::move(requestStreamFlowable), streamId);
  return yarpl::flowable::internal::flowableFromSubscriber<Payload>(
      [innerFlowable = std::move(innerFlowable), eventBase = &eventBase_](
          std::shared_ptr<yarpl::flowable::Subscriber<Payload>> subscriber) {
        innerFlowable->subscribe(std::make_shared<ScheduledSubscriber<Payload>>(
            std::move(subscriber), *eventBase));
      });
}

void ScheduledRSocketResponder::handleFireAndForget(
    Payload request,
    StreamId streamId) {
  inner_->handleFireAndForget(std::move(request), streamId);
}

} // namespace rsocket
