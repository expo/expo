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

#include "rsocket/RSocketResponder.h"

#include <folly/io/async/EventBase.h>
#include <yarpl/flowable/CancelingSubscriber.h>

namespace rsocket {

using namespace yarpl::flowable;
using namespace yarpl::single;

void RSocketResponderCore::handleRequestStream(
    Payload,
    StreamId,
    std::shared_ptr<Subscriber<Payload>> response) noexcept {
  response->onSubscribe(Subscription::create());
  response->onError(std::logic_error("handleRequestStream not implemented"));
}

void RSocketResponderCore::handleRequestResponse(
    Payload,
    StreamId,
    std::shared_ptr<SingleObserver<Payload>> responseObserver) noexcept {
  responseObserver->onSubscribe(SingleSubscriptions::empty());
  responseObserver->onError(
      std::logic_error("handleRequestResponse not implemented"));
}

void RSocketResponderCore::handleFireAndForget(Payload, StreamId) {
  // No default implementation, no error response to provide.
}

void RSocketResponderCore::handleMetadataPush(std::unique_ptr<folly::IOBuf>) {
  // No default implementation, no error response to provide.
}

std::shared_ptr<Subscriber<Payload>> RSocketResponderCore::handleRequestChannel(
    Payload,
    StreamId,
    std::shared_ptr<Subscriber<Payload>> response) noexcept {
  response->onSubscribe(Subscription::create());
  response->onError(std::logic_error("handleRequestStream not implemented"));

  // cancel immediately
  return std::make_shared<CancelingSubscriber<Payload>>();
}

std::shared_ptr<Single<Payload>> RSocketResponder::handleRequestResponse(
    Payload,
    StreamId) {
  return Singles::error<Payload>(
      std::logic_error("handleRequestResponse not implemented"));
}

std::shared_ptr<Flowable<Payload>> RSocketResponder::handleRequestStream(
    Payload,
    StreamId) {
  return Flowable<Payload>::error(
      std::logic_error("handleRequestStream not implemented"));
}

std::shared_ptr<Flowable<Payload>> RSocketResponder::handleRequestChannel(
    Payload,
    std::shared_ptr<Flowable<Payload>>,
    StreamId) {
  return Flowable<Payload>::error(
      std::logic_error("handleRequestChannel not implemented"));
}

void RSocketResponder::handleFireAndForget(Payload, StreamId) {
  // No default implementation, no error response to provide.
}

void RSocketResponder::handleMetadataPush(std::unique_ptr<folly::IOBuf>) {
  // No default implementation, no error response to provide.
}

/// Handles a new Channel requested by the other end.
std::shared_ptr<Subscriber<Payload>>
RSocketResponderAdapter::handleRequestChannel(
    Payload request,
    StreamId streamId,
    std::shared_ptr<Subscriber<Payload>> response) noexcept {
  class EagerSubscriberBridge : public Subscriber<Payload> {
   public:
    void onSubscribe(
        std::shared_ptr<Subscription> subscription) noexcept override {
      CHECK(!subscription_);
      subscription_ = std::move(subscription);
      if (inner_) {
        inner_->onSubscribe(subscription_);
      }
    }

    void onNext(Payload element) noexcept override {
      DCHECK(inner_);
      inner_->onNext(std::move(element));
    }

    void onComplete() noexcept override {
      if (auto inner = std::move(inner_)) {
        inner->onComplete();
        subscription_.reset();
      } else {
        completed_ = true;
      }
    }

    void onError(folly::exception_wrapper ex) noexcept override {
      VLOG(3) << "handleRequestChannelCore::onError: " << ex.what();
      if (auto inner = std::move(inner_)) {
        inner->onError(std::move(ex));
        subscription_.reset();
      } else {
        error_ = std::move(ex);
      }
    }

    void subscribe(std::shared_ptr<Subscriber<Payload>> inner) {
      CHECK(!inner_); // only one call to subscribe is supported
      CHECK(inner);

      inner_ = std::move(inner);
      if (subscription_) {
        inner_->onSubscribe(subscription_);
        // it's possible to get an error or completion before subscribe happens,
        // delay sending it but send it when this class gets subscribed
        if (completed_) {
          onComplete();
        } else if (error_) {
          onError(std::move(error_));
        }
      }
    }

   private:
    std::shared_ptr<Subscriber<Payload>> inner_;
    std::shared_ptr<Subscription> subscription_;
    folly::exception_wrapper error_;
    bool completed_{false};
  };

  auto eagerSubscriber = std::make_shared<EagerSubscriberBridge>();
  auto flowable = inner_->handleRequestChannel(
      std::move(request),
      internal::flowableFromSubscriber<Payload>(
          [eagerSubscriber](std::shared_ptr<Subscriber<Payload>> subscriber) {
            eagerSubscriber->subscribe(subscriber);
          }),
      std::move(streamId));
  // bridge from the existing eager RequestHandler and old Subscriber type
  // to the lazy Flowable and new Subscriber type
  flowable->subscribe(std::move(response));
  return eagerSubscriber;
}

/// Handles a new Stream requested by the other end.
void RSocketResponderAdapter::handleRequestStream(
    Payload request,
    StreamId streamId,
    std::shared_ptr<Subscriber<Payload>> response) noexcept {
  auto flowable =
      inner_->handleRequestStream(std::move(request), std::move(streamId));
  flowable->subscribe(std::move(response));
}

/// Handles a new inbound RequestResponse requested by the other end.
void RSocketResponderAdapter::handleRequestResponse(
    Payload request,
    StreamId streamId,
    std::shared_ptr<SingleObserver<Payload>> responseObserver) noexcept {
  auto single = inner_->handleRequestResponse(std::move(request), streamId);
  single->subscribe(std::move(responseObserver));
}

void RSocketResponderAdapter::handleFireAndForget(
    Payload request,
    StreamId streamId) {
  inner_->handleFireAndForget(std::move(request), streamId);
}

void RSocketResponderAdapter::handleMetadataPush(
    std::unique_ptr<folly::IOBuf> buf) {
  inner_->handleMetadataPush(std::move(buf));
}

} // namespace rsocket
