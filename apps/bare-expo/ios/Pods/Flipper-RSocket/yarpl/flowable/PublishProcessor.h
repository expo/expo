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

#include <folly/Synchronized.h>
#include <vector>
#include "yarpl/Common.h"
#include "yarpl/flowable/Flowable.h"
#include "yarpl/observable/Observable.h"
#include "yarpl/utils/credits.h"

namespace yarpl {
namespace flowable {

// Processor that multicasts all subsequently observed items to its current
// Subscribers. The processor does not coordinate backpressure for its
// subscribers and implements a weaker onSubscribe which calls requests
// kNoFlowControl from the incoming Subscriptions. This makes it possible to
// subscribe the PublishProcessor to multiple sources unlike the standard
// Subscriber contract. If subscribers are not able to keep up with the flow
// control, they are terminated with MissingBackpressureException. The
// implementation of onXXX() and subscribe() methods are technically thread-safe
// but non-serialized calls to them may lead to undefined state in the currently
// subscribed Subscribers.
template <typename T>
class PublishProcessor : public observable::Observable<T>,
                         public Subscriber<T> {
  class PublisherSubscription;
  using PublishersVector = std::vector<std::shared_ptr<PublisherSubscription>>;

 public:
  static std::shared_ptr<PublishProcessor> create() {
    return std::shared_ptr<PublishProcessor>(new PublishProcessor());
  }

  ~PublishProcessor() {
    auto publishers = std::make_shared<const PublishersVector>();
    publishers_.swap(publishers);

    for (const auto& publisher : *publishers) {
      publisher->terminate();
    }
  }

  bool hasSubscribers() const {
    return !publishers_.copy()->empty();
  }

  std::shared_ptr<observable::Subscription> subscribe(
      std::shared_ptr<observable::Observer<T>> subscriber) override {
    auto publisher = std::make_shared<PublisherSubscription>(subscriber, this);
    // we have to call onSubscribe before adding it to the list of publishers
    // because they might start emitting right away
    subscriber->onSubscribe(publisher);

    if (publisher->isCancelled()) {
      return publisher;
    }

    auto publishers = tryAddPublisher(publisher);

    if (publishers == kCompletedPublishers()) {
      publisher->onComplete();
    } else if (publishers == kErroredPublishers()) {
      publisher->onError(std::runtime_error("ErroredPublisher"));
    }

    return publisher;
  }

  void onSubscribe(std::shared_ptr<Subscription> subscription) override {
    auto publishers = publishers_.copy();
    if (publishers == kCompletedPublishers() ||
        publishers == kErroredPublishers()) {
      subscription->cancel();
      return;
    }

    subscription->request(credits::kNoFlowControl);
  }

  void onNext(T value) override {
    auto publishers = publishers_.copy();
    DCHECK(publishers != kCompletedPublishers());
    DCHECK(publishers != kErroredPublishers());

    for (const auto& publisher : *publishers) {
      publisher->onNext(value);
    }
  }

  void onError(folly::exception_wrapper ex) override {
    auto publishers = kErroredPublishers();
    publishers_.swap(publishers);
    DCHECK(publishers != kCompletedPublishers());
    DCHECK(publishers != kErroredPublishers());

    for (const auto& publisher : *publishers) {
      publisher->onError(ex);
    }
  }

  void onComplete() override {
    auto publishers = kCompletedPublishers();
    publishers_.swap(publishers);
    DCHECK(publishers != kCompletedPublishers());
    DCHECK(publishers != kErroredPublishers());

    for (const auto& publisher : *publishers) {
      publisher->onComplete();
    }
  }

 private:
  PublishProcessor() : publishers_{std::make_shared<PublishersVector>()} {}

  std::shared_ptr<const PublishersVector> tryAddPublisher(
      std::shared_ptr<PublisherSubscription> subscriber) {
    while (true) {
      auto oldPublishers = publishers_.copy();
      if (oldPublishers == kCompletedPublishers() ||
          oldPublishers == kErroredPublishers()) {
        return oldPublishers;
      }

      auto newPublishers = std::make_shared<PublishersVector>();
      newPublishers->reserve(oldPublishers->size() + 1);
      newPublishers->insert(
          newPublishers->begin(),
          oldPublishers->cbegin(),
          oldPublishers->cend());
      newPublishers->push_back(subscriber);

      auto locked = publishers_.lock();
      if (*locked == oldPublishers) {
        *locked = newPublishers;
        return newPublishers;
      }
      // else the vector changed so we will have to do it again
    }
  }

  void removePublisher(PublisherSubscription* subscriber) {
    while (true) {
      auto oldPublishers = publishers_.copy();

      auto removingItem = std::find_if(
          oldPublishers->cbegin(),
          oldPublishers->cend(),
          [&](const auto& publisherPtr) {
            return publisherPtr.get() == subscriber;
          });

      if (removingItem == oldPublishers->cend()) {
        // not found anymore
        return;
      }

      auto newPublishers = std::make_shared<PublishersVector>();
      newPublishers->reserve(oldPublishers->size() - 1);
      newPublishers->insert(
          newPublishers->begin(), oldPublishers->cbegin(), removingItem);
      newPublishers->insert(
          newPublishers->end(), std::next(removingItem), oldPublishers->cend());

      auto locked = publishers_.lock();
      if (*locked == oldPublishers) {
        *locked = std::move(newPublishers);
        return;
      }
      // else the vector changed so we will have to do it again
    }
  }

  class PublisherSubscription : public observable::Subscription {
   public:
    PublisherSubscription(
        std::shared_ptr<observable::Observer<T>> subscriber,
        PublishProcessor* processor)
        : subscriber_(std::move(subscriber)), processor_(processor) {}

    // cancel may race with terminate(), but the
    // PublishProcessor::removePublisher will take care of that the race with
    // on{Next, Error, Complete} methods is allowed by the spec
    void cancel() override {
      subscriber_.reset();
      processor_->removePublisher(this);
    }

    // terminate will never race with on{Next, Error, Complete} because they are
    // all called from PublishProcessor and terminate is called only from dtor
    void terminate() {
      if (auto subscriber = std::exchange(subscriber_, nullptr)) {
        subscriber->onError(std::runtime_error("PublishProcessor shutdown"));
      }
    }

    void onNext(T value) {
      if (subscriber_) {
        subscriber_->onNext(std::move(value));
      }
    }

    // used internally, not an interface method
    void onError(folly::exception_wrapper ex) {
      if (auto subscriber = std::exchange(subscriber_, nullptr)) {
        subscriber->onError(std::move(ex));
      }
    }

    // used internally, not an interface method
    void onComplete() {
      if (auto subscriber = std::exchange(subscriber_, nullptr)) {
        subscriber->onComplete();
      }
    }

    bool isCancelled() const {
      return !subscriber_;
    }

   private:
    std::shared_ptr<observable::Observer<T>> subscriber_;
    PublishProcessor* processor_;
  };

  static const std::shared_ptr<const PublishersVector>& kCompletedPublishers() {
    static std::shared_ptr<const PublishersVector> constant =
        std::make_shared<const PublishersVector>();
    return constant;
  }

  static const std::shared_ptr<const PublishersVector>& kErroredPublishers() {
    static std::shared_ptr<const PublishersVector> constant =
        std::make_shared<const PublishersVector>();
    return constant;
  }

  folly::Synchronized<std::shared_ptr<const PublishersVector>, std::mutex>
      publishers_;
};
} // namespace flowable
} // namespace yarpl
