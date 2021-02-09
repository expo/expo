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

#include <folly/functional/Invoke.h>
#include <memory>
#include <type_traits>
#include <utility>

#include "yarpl/Refcounted.h"
#include "yarpl/observable/Observer.h"
#include "yarpl/observable/Subscription.h"

#include "yarpl/Common.h"
#include "yarpl/Flowable.h"
#include "yarpl/flowable/Flowable_FromObservable.h"

namespace yarpl {

namespace observable {

template <typename T = void>
class Observable : public yarpl::enable_get_ref {
 public:
  static std::shared_ptr<Observable<T>> empty() {
    auto lambda = [](std::shared_ptr<Observer<T>> observer) {
      observer->onComplete();
    };
    return Observable<T>::create(std::move(lambda));
  }

  static std::shared_ptr<Observable<T>> error(folly::exception_wrapper ex) {
    auto lambda =
        [ex = std::move(ex)](std::shared_ptr<Observer<T>> observer) mutable {
          observer->onError(std::move(ex));
        };
    return Observable<T>::create(std::move(lambda));
  }

  template <typename Ex>
  static std::shared_ptr<Observable<T>> error(Ex&) {
    static_assert(
        std::is_lvalue_reference<Ex>::value,
        "use variant of error() method accepting also exception_ptr");
  }

  template <typename Ex>
  static std::shared_ptr<Observable<T>> error(Ex& ex, std::exception_ptr ptr) {
    auto lambda = [ew = folly::exception_wrapper(std::move(ptr), ex)](
                      std::shared_ptr<Observer<T>> observer) mutable {
      observer->onError(std::move(ew));
    };
    return Observable<T>::create(std::move(lambda));
  }

  static std::shared_ptr<Observable<T>> just(T value) {
    auto lambda =
        [value = std::move(value)](std::shared_ptr<Observer<T>> observer) {
          observer->onNext(value);
          observer->onComplete();
        };

    return Observable<T>::create(std::move(lambda));
  }

  /**
   * The Defer operator waits until an observer subscribes to it, and then it
   * generates an Observable with an ObservableFactory function. It
   * does this afresh for each subscriber, so although each subscriber may
   * think it is subscribing to the same Observable, in fact each subscriber
   * gets its own individual sequence.
   */
  template <
      typename ObservableFactory,
      typename = typename std::enable_if<folly::is_invocable_r<
          std::shared_ptr<Observable<T>>,
          std::decay_t<ObservableFactory>&>::value>::type>
  static std::shared_ptr<Observable<T>> defer(ObservableFactory&&);

  static std::shared_ptr<Observable<T>> justN(std::initializer_list<T> list) {
    auto lambda = [v = std::vector<T>(std::move(list))](
                      std::shared_ptr<Observer<T>> observer) {
      for (auto const& elem : v) {
        observer->onNext(elem);
      }
      observer->onComplete();
    };

    return Observable<T>::create(std::move(lambda));
  }

  // this will generate an observable which can be subscribed to only once
  static std::shared_ptr<Observable<T>> justOnce(T value) {
    auto lambda = [value = std::move(value), used = false](
                      std::shared_ptr<Observer<T>> observer) mutable {
      if (used) {
        observer->onError(
            std::runtime_error("justOnce value was already used"));
        return;
      }

      used = true;
      observer->onNext(std::move(value));
      observer->onComplete();
    };

    return Observable<T>::create(std::move(lambda));
  }

  template <typename OnSubscribe>
  static std::shared_ptr<Observable<T>> create(OnSubscribe&&);

  template <typename OnSubscribe>
  static std::shared_ptr<Observable<T>> createEx(OnSubscribe&&);

  virtual std::shared_ptr<Subscription> subscribe(
      std::shared_ptr<Observer<T>>) = 0;

  /**
   * Subscribe overload that accepts lambdas.
   */
  template <
      typename Next,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value>::type>
  std::shared_ptr<Subscription> subscribe(Next&& next) {
    return subscribe(Observer<T>::create(std::forward<Next>(next)));
  }

  /**
   * Subscribe overload that accepts lambdas.
   */
  template <
      typename Next,
      typename Error,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value>::type>
  std::shared_ptr<Subscription> subscribe(Next&& next, Error&& error) {
    return subscribe(Observer<T>::create(
        std::forward<Next>(next), std::forward<Error>(error)));
  }

  /**
   * Subscribe overload that accepts lambdas.
   */
  template <
      typename Next,
      typename Error,
      typename Complete,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value &&
          folly::is_invocable<std::decay_t<Complete>&>::value>::type>
  std::shared_ptr<Subscription>
  subscribe(Next&& next, Error&& error, Complete&& complete) {
    return subscribe(Observer<T>::create(
        std::forward<Next>(next),
        std::forward<Error>(error),
        std::forward<Complete>(complete)));
  }

  std::shared_ptr<Subscription> subscribe() {
    return subscribe(Observer<T>::create());
  }

  template <
      typename Function,
      typename R = typename folly::invoke_result_t<Function, T>>
  std::shared_ptr<Observable<R>> map(Function&& function);

  template <typename Function>
  std::shared_ptr<Observable<T>> filter(Function&& function);

  template <
      typename Function,
      typename R = typename folly::invoke_result_t<Function, T, T>>
  std::shared_ptr<Observable<R>> reduce(Function&& function);

  std::shared_ptr<Observable<T>> take(int64_t);

  std::shared_ptr<Observable<T>> skip(int64_t);

  std::shared_ptr<Observable<T>> ignoreElements();

  std::shared_ptr<Observable<T>> subscribeOn(folly::Executor&);

  std::shared_ptr<Observable<T>> concatWith(std::shared_ptr<Observable<T>>);

  template <typename... Args>
  std::shared_ptr<Observable<T>> concatWith(
      std::shared_ptr<Observable<T>> first,
      Args... args) {
    return concatWith(first)->concatWith(args...);
  }

  template <typename... Args>
  static std::shared_ptr<Observable<T>> concat(
      std::shared_ptr<Observable<T>> first,
      Args... args) {
    return first->concatWith(args...);
  }

  // function is invoked when onComplete occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Observable<T>> doOnSubscribe(Function&& function);

  // function is invoked when onNext occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&, const T&>::value>::type>
  std::shared_ptr<Observable<T>> doOnNext(Function&& function);

  // function is invoked when onError occurs.
  template <
      typename Function,
      typename = typename std::enable_if<folly::is_invocable<
          std::decay_t<Function>&,
          folly::exception_wrapper&>::value>::type>
  std::shared_ptr<Observable<T>> doOnError(Function&& function);

  // function is invoked when onComplete occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Observable<T>> doOnComplete(Function&& function);

  // function is invoked when either onComplete or onError occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Observable<T>> doOnTerminate(Function&& function);

  // the function is invoked for each of onNext, onCompleted, onError
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Observable<T>> doOnEach(Function&& function);

  // the callbacks will be invoked of each of the signals
  template <
      typename OnNextFunc,
      typename OnCompleteFunc,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<OnNextFunc>&, const T&>::value>::
          type,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<OnCompleteFunc>&>::value>::type>
  std::shared_ptr<Observable<T>> doOn(
      OnNextFunc&& onNext,
      OnCompleteFunc&& onComplete);

  // the callbacks will be invoked of each of the signals
  template <
      typename OnNextFunc,
      typename OnCompleteFunc,
      typename OnErrorFunc,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<OnNextFunc>&, const T&>::value>::
          type,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<OnCompleteFunc>&>::value>::type,
      typename = typename std::enable_if<folly::is_invocable<
          std::decay_t<OnErrorFunc>&,
          folly::exception_wrapper&>::value>::type>
  std::shared_ptr<Observable<T>>
  doOn(OnNextFunc&& onNext, OnCompleteFunc&& onComplete, OnErrorFunc&& onError);

  // function is invoked when cancel is called.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Observable<T>> doOnCancel(Function&& function);

  /**
   * Convert from Observable to Flowable with a given BackpressureStrategy.
   */
  auto toFlowable(BackpressureStrategy strategy);

  /**
   * Convert from Observable to Flowable with a given BackpressureStrategy.
   */
  auto toFlowable(std::shared_ptr<IBackpressureStrategy<T>> strategy);
};
} // namespace observable
} // namespace yarpl

#include "yarpl/observable/DeferObservable.h"
#include "yarpl/observable/ObservableOperator.h"

namespace yarpl {
namespace observable {

template <typename T>
template <typename OnSubscribe>
std::shared_ptr<Observable<T>> Observable<T>::create(OnSubscribe&& function) {
  static_assert(
      folly::is_invocable<OnSubscribe&&, std::shared_ptr<Observer<T>>>::value,
      "OnSubscribe must have type `void(std::shared_ptr<Observer<T>>)`");

  return createEx([func = std::forward<OnSubscribe>(function)](
                      std::shared_ptr<Observer<T>> observer,
                      std::shared_ptr<Subscription>) mutable {
    func(std::move(observer));
  });
}

template <typename T>
template <typename OnSubscribe>
std::shared_ptr<Observable<T>> Observable<T>::createEx(OnSubscribe&& function) {
  static_assert(
      folly::is_invocable<
          OnSubscribe&&,
          std::shared_ptr<Observer<T>>,
          std::shared_ptr<Subscription>>::value,
      "OnSubscribe must have type "
      "`void(std::shared_ptr<Observer<T>>, std::shared_ptr<Subscription>)`");

  return std::make_shared<FromPublisherOperator<T, std::decay_t<OnSubscribe>>>(
      std::forward<OnSubscribe>(function));
}

template <typename T>
template <typename ObservableFactory, typename>
std::shared_ptr<Observable<T>> Observable<T>::defer(
    ObservableFactory&& factory) {
  return std::make_shared<
      details::DeferObservable<T, std::decay_t<ObservableFactory>>>(
      std::forward<ObservableFactory>(factory));
}

template <typename T>
template <typename Function, typename R>
std::shared_ptr<Observable<R>> Observable<T>::map(Function&& function) {
  return std::make_shared<MapOperator<T, R, std::decay_t<Function>>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

template <typename T>
template <typename Function>
std::shared_ptr<Observable<T>> Observable<T>::filter(Function&& function) {
  return std::make_shared<FilterOperator<T, std::decay_t<Function>>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

template <typename T>
template <typename Function, typename R>
std::shared_ptr<Observable<R>> Observable<T>::reduce(Function&& function) {
  return std::make_shared<ReduceOperator<T, R, std::decay_t<Function>>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

template <typename T>
std::shared_ptr<Observable<T>> Observable<T>::take(int64_t limit) {
  return std::make_shared<TakeOperator<T>>(this->ref_from_this(this), limit);
}

template <typename T>
std::shared_ptr<Observable<T>> Observable<T>::skip(int64_t offset) {
  return std::make_shared<SkipOperator<T>>(this->ref_from_this(this), offset);
}

template <typename T>
std::shared_ptr<Observable<T>> Observable<T>::ignoreElements() {
  return std::make_shared<IgnoreElementsOperator<T>>(this->ref_from_this(this));
}

template <typename T>
std::shared_ptr<Observable<T>> Observable<T>::subscribeOn(
    folly::Executor& executor) {
  return std::make_shared<SubscribeOnOperator<T>>(
      this->ref_from_this(this), executor);
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnSubscribe(
    Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      std::forward<Function>(function),
      [](const T&) {},
      [](const auto&) {},
      [] {},
      [] {}); // onCancel
}

template <typename T>
std::shared_ptr<Observable<T>> Observable<T>::concatWith(
    std::shared_ptr<Observable<T>> next) {
  return std::make_shared<details::ConcatWithOperator<T>>(
      this->ref_from_this(this), std::move(next));
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnNext(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      std::forward<Function>(function),
      [](const auto&) {},
      [] {},
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnError(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [](const T&) {},
      std::forward<Function>(function),
      [] {},
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnComplete(
    Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [](const T&) {},
      [](const auto&) {},
      std::forward<Function>(function),
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnTerminate(
    Function&& function) {
  auto sharedFunction = std::make_shared<std::decay_t<Function>>(
      std::forward<Function>(function));
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [](const T&) {},
      [sharedFunction](const auto&) { (*sharedFunction)(); },
      [sharedFunction]() { (*sharedFunction)(); },
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnEach(Function&& function) {
  auto sharedFunction = std::make_shared<std::decay_t<Function>>(
      std::forward<Function>(function));
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [sharedFunction](const T&) { (*sharedFunction)(); },
      [sharedFunction](const auto&) { (*sharedFunction)(); },
      [sharedFunction]() { (*sharedFunction)(); },
      [] {}); // onCancel
}

template <typename T>
template <typename OnNextFunc, typename OnCompleteFunc, typename, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOn(
    OnNextFunc&& onNext,
    OnCompleteFunc&& onComplete) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      std::forward<OnNextFunc>(onNext),
      [](const auto&) {},
      std::forward<OnCompleteFunc>(onComplete),
      [] {}); // onCancel
}

template <typename T>
template <
    typename OnNextFunc,
    typename OnCompleteFunc,
    typename OnErrorFunc,
    typename,
    typename,
    typename>
std::shared_ptr<Observable<T>> Observable<T>::doOn(
    OnNextFunc&& onNext,
    OnCompleteFunc&& onComplete,
    OnErrorFunc&& onError) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      std::forward<OnNextFunc>(onNext),
      std::forward<OnErrorFunc>(onError),
      std::forward<OnCompleteFunc>(onComplete),
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Observable<T>> Observable<T>::doOnCancel(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {}, // onSubscribe
      [](const auto&) {}, // onNext
      [](const auto&) {}, // onError
      [] {}, // onComplete
      std::forward<Function>(function)); // onCancel
}

template <typename T>
auto Observable<T>::toFlowable(BackpressureStrategy strategy) {
  switch (strategy) {
    case BackpressureStrategy::DROP:
      return toFlowable(IBackpressureStrategy<T>::drop());
    case BackpressureStrategy::ERROR:
      return toFlowable(IBackpressureStrategy<T>::error());
    case BackpressureStrategy::BUFFER:
      return toFlowable(IBackpressureStrategy<T>::buffer());
    case BackpressureStrategy::LATEST:
      return toFlowable(IBackpressureStrategy<T>::latest());
    case BackpressureStrategy::MISSING:
      return toFlowable(IBackpressureStrategy<T>::missing());
    default:
      CHECK(false); // unknown value for strategy
  }
}

template <typename T>
auto Observable<T>::toFlowable(
    std::shared_ptr<IBackpressureStrategy<T>> strategy) {
  return yarpl::flowable::internal::flowableFromSubscriber<T>(
      [thisObservable = this->ref_from_this(this),
       strategy = std::move(strategy)](
          std::shared_ptr<flowable::Subscriber<T>> subscriber) {
        strategy->init(std::move(thisObservable), std::move(subscriber));
      });
}

} // namespace observable
} // namespace yarpl
