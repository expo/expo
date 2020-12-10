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

#include "rsocket/RSocketRequester.h"

#include <folly/ExceptionWrapper.h>

#include "rsocket/internal/ScheduledSingleObserver.h"
#include "rsocket/internal/ScheduledSubscriber.h"
#include "yarpl/Flowable.h"
#include "yarpl/single/SingleSubscriptions.h"

using namespace folly;

namespace rsocket {

namespace {

template <class Fn>
void runOnCorrectThread(folly::EventBase& evb, Fn fn) {
  if (evb.isInEventBaseThread()) {
    fn();
  } else {
    evb.runInEventBaseThread(std::move(fn));
  }
}

} // namespace

RSocketRequester::RSocketRequester(
    std::shared_ptr<RSocketStateMachine> srs,
    EventBase& eventBase)
    : stateMachine_{std::move(srs)}, eventBase_{&eventBase} {}

RSocketRequester::~RSocketRequester() {
  VLOG(1) << "Destroying RSocketRequester";
}

void RSocketRequester::closeSocket() {
  eventBase_->runInEventBaseThread([stateMachine = std::move(stateMachine_)] {
    VLOG(2) << "Closing RSocketStateMachine on EventBase";
    stateMachine->close({}, StreamCompletionSignal::SOCKET_CLOSED);
  });
}

std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
RSocketRequester::requestChannel(
    std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
        requestStream) {
  return requestChannel({}, false, std::move(requestStream));
}

std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
RSocketRequester::requestChannel(
    Payload request,
    std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
        requestStream) {
  return requestChannel(std::move(request), true, std::move(requestStream));
}

std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
RSocketRequester::requestChannel(
    Payload request,
    bool hasInitialRequest,
    std::shared_ptr<yarpl::flowable::Flowable<rsocket::Payload>>
        requestStreamFlowable) {
  CHECK(stateMachine_);

  return yarpl::flowable::internal::flowableFromSubscriber<Payload>(
      [eb = eventBase_,
       req = std::move(request),
       hasInitialRequest,
       requestStream = std::move(requestStreamFlowable),
       srs = stateMachine_](
          std::shared_ptr<yarpl::flowable::Subscriber<Payload>> subscriber) {
        auto lambda = [eb,
                       r = req.clone(),
                       hasInitialRequest,
                       requestStream,
                       srs,
                       subs = std::move(subscriber)]() mutable {
          auto scheduled =
              std::make_shared<ScheduledSubscriptionSubscriber<Payload>>(
                  std::move(subs), *eb);
          auto responseSink = srs->requestChannel(
              std::move(r), hasInitialRequest, std::move(scheduled));
          // responseSink is wrapped with thread scheduling
          // so all emissions happen on the right thread.

          // If we don't get a responseSink back, that means that
          // the requesting peer wasn't connected (or similar error)
          // and the Flowable it gets back will immediately call onError.
          if (responseSink) {
            auto scheduledResponse =
                std::make_shared<ScheduledSubscriber<Payload>>(
                    std::move(responseSink), *eb);
            requestStream->subscribe(std::move(scheduledResponse));
          }
        };
        runOnCorrectThread(*eb, std::move(lambda));
      });
}

std::shared_ptr<yarpl::flowable::Flowable<Payload>>
RSocketRequester::requestStream(Payload request) {
  CHECK(stateMachine_);

  return yarpl::flowable::internal::flowableFromSubscriber<Payload>(
      [eb = eventBase_, req = std::move(request), srs = stateMachine_](
          std::shared_ptr<yarpl::flowable::Subscriber<Payload>> subscriber) {
        auto lambda =
            [eb, r = req.clone(), srs, subs = std::move(subscriber)]() mutable {
              auto scheduled =
                  std::make_shared<ScheduledSubscriptionSubscriber<Payload>>(
                      std::move(subs), *eb);
              srs->requestStream(std::move(r), std::move(scheduled));
            };
        runOnCorrectThread(*eb, std::move(lambda));
      });
}

std::shared_ptr<yarpl::single::Single<rsocket::Payload>>
RSocketRequester::requestResponse(Payload request) {
  CHECK(stateMachine_);

  return yarpl::single::Single<Payload>::create(
      [eb = eventBase_, req = std::move(request), srs = stateMachine_](
          std::shared_ptr<yarpl::single::SingleObserver<Payload>> observer) {
        auto lambda = [eb,
                       r = req.clone(),
                       srs,
                       obs = std::move(observer)]() mutable {
          auto scheduled =
              std::make_shared<ScheduledSubscriptionSingleObserver<Payload>>(
                  std::move(obs), *eb);
          srs->requestResponse(std::move(r), std::move(scheduled));
        };
        runOnCorrectThread(*eb, std::move(lambda));
      });
}

std::shared_ptr<yarpl::single::Single<void>> RSocketRequester::fireAndForget(
    rsocket::Payload request) {
  CHECK(stateMachine_);

  return yarpl::single::Single<void>::create(
      [eb = eventBase_, req = std::move(request), srs = stateMachine_](
          std::shared_ptr<yarpl::single::SingleObserverBase<void>> subscriber) {
        auto lambda =
            [r = req.clone(), srs, subs = std::move(subscriber)]() mutable {
              // TODO: Pass in SingleSubscriber for underlying layers to call
              // onSuccess/onError once put on network.
              srs->fireAndForget(std::move(r));
              subs->onSubscribe(yarpl::single::SingleSubscriptions::empty());
              subs->onSuccess();
            };
        runOnCorrectThread(*eb, std::move(lambda));
      });
}

void RSocketRequester::metadataPush(std::unique_ptr<folly::IOBuf> metadata) {
  CHECK(stateMachine_);

  runOnCorrectThread(
      *eventBase_, [srs = stateMachine_, meta = std::move(metadata)]() mutable {
        srs->metadataPush(std::move(meta));
      });
}

} // namespace rsocket
