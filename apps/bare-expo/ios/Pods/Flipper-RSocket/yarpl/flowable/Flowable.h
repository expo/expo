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

#include <folly/Executor.h>
#include <folly/functional/Invoke.h>
#include <folly/io/async/HHWheelTimer.h>
#include <glog/logging.h>
#include <memory>
#include "yarpl/Disposable.h"
#include "yarpl/Refcounted.h"
#include "yarpl/flowable/Subscriber.h"
#include "yarpl/utils/credits.h"

namespace yarpl {

class TimeoutException;
namespace detail {
class TimeoutExceptionGenerator;
}

namespace flowable {

template <typename T = void>
class Flowable;

namespace details {

template <typename T>
struct IsFlowable : std::false_type {};

template <typename R>
struct IsFlowable<std::shared_ptr<Flowable<R>>> : std::true_type {
  using ElemType = R;
};

} // namespace details

template <typename T>
class Flowable : public yarpl::enable_get_ref {
 public:
  virtual ~Flowable() = default;

  virtual void subscribe(std::shared_ptr<Subscriber<T>>) = 0;

  /**
   * Subscribe overload that accepts lambdas.
   */
  template <
      typename Next,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value>::type>
  std::unique_ptr<Disposable> subscribe(
      Next&& next,
      int64_t batch = credits::kNoFlowControl) {
    auto subscriber =
        details::LambdaSubscriber<T>::create(std::forward<Next>(next), batch);
    subscribe(subscriber);
    return std::make_unique<details::BaseSubscriberDisposable<T>>(
        std::move(subscriber));
  }

  /**
   * Subscribe overload that accepts lambdas.
   *
   * Takes an optional batch size for request_n. Default is no flow control.
   */
  template <
      typename Next,
      typename Error,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Next>&, T>::value &&
          folly::is_invocable<std::decay_t<Error>&, folly::exception_wrapper>::
              value>::type>
  std::unique_ptr<Disposable> subscribe(
      Next&& next,
      Error&& e,
      int64_t batch = credits::kNoFlowControl) {
    auto subscriber = details::LambdaSubscriber<T>::create(
        std::forward<Next>(next), std::forward<Error>(e), batch);
    subscribe(subscriber);
    return std::make_unique<details::BaseSubscriberDisposable<T>>(
        std::move(subscriber));
  }

  /**
   * Subscribe overload that accepts lambdas.
   *
   * Takes an optional batch size for request_n. Default is no flow control.
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
  std::unique_ptr<Disposable> subscribe(
      Next&& next,
      Error&& e,
      Complete&& complete,
      int64_t batch = credits::kNoFlowControl) {
    auto subscriber = details::LambdaSubscriber<T>::create(
        std::forward<Next>(next),
        std::forward<Error>(e),
        std::forward<Complete>(complete),
        batch);
    subscribe(subscriber);
    return std::make_unique<details::BaseSubscriberDisposable<T>>(
        std::move(subscriber));
  }

  void subscribe() {
    subscribe(Subscriber<T>::create());
  }

  //
  // creator methods:
  //

  // Creates Flowable which completes the subscriber right after it subscribes
  static std::shared_ptr<Flowable<T>> empty();

  // Creates Flowable which will never terminate the subscriber
  static std::shared_ptr<Flowable<T>> never();

  // Create Flowable which will imediatelly terminate the subscriber upon
  // subscription with the provided error
  static std::shared_ptr<Flowable<T>> error(folly::exception_wrapper ex);

  template <typename Ex>
  static std::shared_ptr<Flowable<T>> error(Ex&) {
    static_assert(
        std::is_lvalue_reference<Ex>::value,
        "use variant of error() method accepting also exception_ptr");
  }

  template <typename Ex>
  static std::shared_ptr<Flowable<T>> error(Ex& ex, std::exception_ptr ptr) {
    return Flowable<T>::error(folly::exception_wrapper(std::move(ptr), ex));
  }

  static std::shared_ptr<Flowable<T>> just(T value) {
    auto lambda = [value = std::move(value)](
                      Subscriber<T>& subscriber, int64_t requested) mutable {
      DCHECK_GT(requested, 0);
      subscriber.onNext(std::move(value));
      subscriber.onComplete();
    };

    return Flowable<T>::create(std::move(lambda));
  }

  static std::shared_ptr<Flowable<T>> justN(std::initializer_list<T> list) {
    auto lambda = [v = std::vector<T>(std::move(list)), i = size_t{0}](
                      Subscriber<T>& subscriber, int64_t requested) mutable {
      while (i < v.size() && requested-- > 0) {
        subscriber.onNext(v[i++]);
      }

      if (i == v.size()) {
        // TODO T27302402: Even though having two subscriptions exist
        // concurrently for Emitters is not possible still. At least it possible
        // to resubscribe and consume the same values again.
        i = 0;
        subscriber.onComplete();
      }
    };

    return Flowable<T>::create(std::move(lambda));
  }

  // this will generate a flowable which can be subscribed to only once
  static std::shared_ptr<Flowable<T>> justOnce(T value) {
    auto lambda = [value = std::move(value), used = false](
                      Subscriber<T>& subscriber, int64_t) mutable {
      if (used) {
        subscriber.onError(
            std::runtime_error("justOnce value was already used"));
        return;
      }

      used = true;
      // # requested should be > 0.  Ignoring the actual parameter.
      subscriber.onNext(std::move(value));
      subscriber.onComplete();
    };

    return Flowable<T>::create(std::move(lambda));
  }

  template <typename TGenerator>
  static std::shared_ptr<Flowable<T>> fromGenerator(TGenerator&& generator);

  /**
   * The Defer operator waits until a subscriber subscribes to it, and then it
   * generates a Flowabe with a FlowableFactory function. It
   * does this afresh for each subscriber, so although each subscriber may
   * think it is subscribing to the same Flowable, in fact each subscriber
   * gets its own individual sequence.
   */
  template <
      typename FlowableFactory,
      typename = typename std::enable_if<folly::is_invocable_r<
          std::shared_ptr<Flowable<T>>,
          std::decay_t<FlowableFactory>&>::value>::type>
  static std::shared_ptr<Flowable<T>> defer(FlowableFactory&&);

  template <
      typename Function,
      typename ErrorFunction =
          folly::Function<folly::exception_wrapper(folly::exception_wrapper&&)>,
      typename R = typename folly::invoke_result_t<Function, T>,
      typename = typename std::enable_if<folly::is_invocable_r<
          folly::exception_wrapper,
          std::decay_t<ErrorFunction>&,
          folly::exception_wrapper&&>::value>::type>
  std::shared_ptr<Flowable<R>> map(
      Function&& function,
      ErrorFunction&& errormapFunc = [](folly::exception_wrapper&& ew) {
        return std::move(ew);
      });

  template <
      typename Function,
      typename R = typename details::IsFlowable<
          typename folly::invoke_result_t<Function, T>>::ElemType>
  std::shared_ptr<Flowable<R>> flatMap(Function&& func);

  template <typename Function>
  std::shared_ptr<Flowable<T>> filter(Function&& function);

  template <
      typename Function,
      typename R = typename folly::invoke_result_t<Function, T, T>>
  std::shared_ptr<Flowable<R>> reduce(Function&& function);

  std::shared_ptr<Flowable<T>> take(int64_t);

  std::shared_ptr<Flowable<T>> skip(int64_t);

  std::shared_ptr<Flowable<T>> ignoreElements();

  /*
   * To instruct a Flowable to do its work on a particular Executor.
   * the onSubscribe, request and cancel methods will be scheduled on the
   * provided executor
   */
  std::shared_ptr<Flowable<T>> subscribeOn(folly::Executor&);

  std::shared_ptr<Flowable<T>> observeOn(folly::Executor&);

  std::shared_ptr<Flowable<T>> observeOn(folly::Executor::KeepAlive<>);

  std::shared_ptr<Flowable<T>> concatWith(std::shared_ptr<Flowable<T>>);

  template <typename... Args>
  std::shared_ptr<Flowable<T>> concatWith(
      std::shared_ptr<Flowable<T>> first,
      Args... args) {
    return concatWith(first)->concatWith(args...);
  }

  template <typename... Args>
  static std::shared_ptr<Flowable<T>> concat(
      std::shared_ptr<Flowable<T>> first,
      Args... args) {
    return first->concatWith(args...);
  }

  template <typename Q>
  using enableWrapRef =
      typename std::enable_if<details::IsFlowable<Q>::value, Q>::type;

  // Combines multiple Flowables so that they act like a
  // single Flowable. The items
  // emitted by the merged Flowables may interlieve.
  template <typename Q = T>
  enableWrapRef<Q> merge() {
    return this->flatMap([](auto f) { return std::move(f); });
  }

  // function is invoked when onComplete occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnSubscribe(Function&& function);

  // function is invoked when onNext occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&, const T&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnNext(Function&& function);

  // function is invoked when onError occurs.
  template <
      typename Function,
      typename = typename std::enable_if<folly::is_invocable<
          std::decay_t<Function>&,
          folly::exception_wrapper&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnError(Function&& function);

  // function is invoked when onComplete occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnComplete(Function&& function);

  // function is invoked when either onComplete or onError occurs.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnTerminate(Function&& function);

  // the function is invoked for each of onNext, onCompleted, onError
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnEach(Function&& function);

  // function is invoked when request(n) is called.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&, int64_t>::value>::type>
  std::shared_ptr<Flowable<T>> doOnRequest(Function&& function);

  // function is invoked when cancel is called.
  template <
      typename Function,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<Function>&>::value>::type>
  std::shared_ptr<Flowable<T>> doOnCancel(Function&& function);

  // the callbacks will be invoked of each of the signals
  template <
      typename OnNextFunc,
      typename OnCompleteFunc,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<OnNextFunc>&, const T&>::value>::
          type,
      typename = typename std::enable_if<
          folly::is_invocable<std::decay_t<OnCompleteFunc>&>::value>::type>
  std::shared_ptr<Flowable<T>> doOn(
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
  std::shared_ptr<Flowable<T>>
  doOn(OnNextFunc&& onNext, OnCompleteFunc&& onComplete, OnErrorFunc&& onError);

  template <
      typename ExceptionGenerator = yarpl::detail::TimeoutExceptionGenerator>
  std::shared_ptr<Flowable<T>> timeout(
      folly::EventBase& timerEvb,
      std::chrono::milliseconds timeout,
      std::chrono::milliseconds initTimeout,
      ExceptionGenerator&& exnGen = ExceptionGenerator());

  template <
      typename Emitter,
      typename = typename std::enable_if<folly::is_invocable_r<
          void,
          std::decay_t<Emitter>&,
          Subscriber<T>&,
          int64_t>::value>::type>
  static std::shared_ptr<Flowable<T>> create(Emitter&& emitter);

  template <
      typename OnSubscribe,
      typename = typename std::enable_if<folly::is_invocable<
          OnSubscribe&&,
          std::shared_ptr<Subscriber<T>>>::value>::type>
  // TODO(lehecka): enable this warning once mobile code is clear
  // [[deprecated(
  //     "Flowable<T>::fromPublisher is deprecated: Use PublishProcessor or "
  //     "contact rsocket team if you can't figure out what to replace it "
  //     "with")]]
  static std::shared_ptr<Flowable<T>> fromPublisher(OnSubscribe&& function);
};

} // namespace flowable
} // namespace yarpl

#include "yarpl/flowable/DeferFlowable.h"
#include "yarpl/flowable/EmitterFlowable.h"
#include "yarpl/flowable/FlowableOperator.h"

namespace yarpl {
namespace flowable {

template <typename T>
template <typename Emitter, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::create(Emitter&& emitter) {
  return std::make_shared<details::EmitterWrapper<T, std::decay_t<Emitter>>>(
      std::forward<Emitter>(emitter));
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::empty() {
  class EmptyFlowable : public Flowable<T> {
    void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
      subscriber->onSubscribe(Subscription::create());
      // does not wait for request(n) to complete
      subscriber->onComplete();
    }
  };
  return std::make_shared<EmptyFlowable>();
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::never() {
  class NeverFlowable : public Flowable<T> {
    void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
      subscriber->onSubscribe(Subscription::create());
    }
  };
  return std::make_shared<NeverFlowable>();
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::error(folly::exception_wrapper ex) {
  class ErrorFlowable : public Flowable<T> {
    void subscribe(std::shared_ptr<Subscriber<T>> subscriber) override {
      subscriber->onSubscribe(Subscription::create());
      // does not wait for request(n) to error
      subscriber->onError(ex_);
    }
    folly::exception_wrapper ex_;

   public:
    explicit ErrorFlowable(folly::exception_wrapper ew) : ex_(std::move(ew)) {}
  };
  return std::make_shared<ErrorFlowable>(std::move(ex));
}

namespace internal {
template <typename T, typename OnSubscribe>
std::shared_ptr<Flowable<T>> flowableFromSubscriber(OnSubscribe&& function) {
  return std::make_shared<FromPublisherOperator<T, std::decay_t<OnSubscribe>>>(
      std::forward<OnSubscribe>(function));
}
} // namespace internal

// TODO(lehecka): remove
template <typename T>
template <typename OnSubscribe, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::fromPublisher(
    OnSubscribe&& function) {
  return internal::flowableFromSubscriber<T>(
      std::forward<OnSubscribe>(function));
}

template <typename T>
template <typename TGenerator>
std::shared_ptr<Flowable<T>> Flowable<T>::fromGenerator(
    TGenerator&& generator) {
  auto lambda = [generator = std::forward<TGenerator>(generator)](
                    Subscriber<T>& subscriber, int64_t requested) mutable {
    try {
      while (requested-- > 0) {
        subscriber.onNext(generator());
      }
    } catch (const std::exception& ex) {
      subscriber.onError(
          folly::exception_wrapper(std::current_exception(), ex));
    } catch (...) {
      subscriber.onError(std::runtime_error(
          "Flowable::fromGenerator() threw from Subscriber:onNext()"));
    }
  };
  return Flowable<T>::create(std::move(lambda));
} // namespace flowable

template <typename T>
template <typename FlowableFactory, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::defer(FlowableFactory&& factory) {
  return std::make_shared<
      details::DeferFlowable<T, std::decay_t<FlowableFactory>>>(
      std::forward<FlowableFactory>(factory));
}

template <typename T>
template <typename Function, typename ErrorFunction, typename R, typename>
std::shared_ptr<Flowable<R>> Flowable<T>::map(
    Function&& function,
    ErrorFunction&& errorFunction) {
  return std::make_shared<
      MapOperator<T, R, std::decay_t<Function>, std::decay_t<ErrorFunction>>>(
      this->ref_from_this(this),
      std::forward<Function>(function),
      std::forward<ErrorFunction>(errorFunction));
}

template <typename T>
template <typename Function>
std::shared_ptr<Flowable<T>> Flowable<T>::filter(Function&& function) {
  return std::make_shared<FilterOperator<T, std::decay_t<Function>>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

template <typename T>
template <typename Function, typename R>
std::shared_ptr<Flowable<R>> Flowable<T>::reduce(Function&& function) {
  return std::make_shared<ReduceOperator<T, R, std::decay_t<Function>>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::take(int64_t limit) {
  return std::make_shared<TakeOperator<T>>(this->ref_from_this(this), limit);
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::skip(int64_t offset) {
  return std::make_shared<SkipOperator<T>>(this->ref_from_this(this), offset);
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::ignoreElements() {
  return std::make_shared<IgnoreElementsOperator<T>>(this->ref_from_this(this));
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::subscribeOn(
    folly::Executor& executor) {
  return std::make_shared<SubscribeOnOperator<T>>(
      this->ref_from_this(this), executor);
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::observeOn(folly::Executor& executor) {
  return observeOn(folly::getKeepAliveToken(executor));
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::observeOn(
    folly::Executor::KeepAlive<> executor) {
  return std::make_shared<yarpl::flowable::detail::ObserveOnOperator<T>>(
      this->ref_from_this(this), std::move(executor));
}

template <typename T>
template <typename Function, typename R>
std::shared_ptr<Flowable<R>> Flowable<T>::flatMap(Function&& function) {
  return std::make_shared<FlatMapOperator<T, R>>(
      this->ref_from_this(this), std::forward<Function>(function));
}

template <typename T>
std::shared_ptr<Flowable<T>> Flowable<T>::concatWith(
    std::shared_ptr<Flowable<T>> next) {
  return std::make_shared<details::ConcatWithOperator<T>>(
      this->ref_from_this(this), std::move(next));
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnSubscribe(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      std::forward<Function>(function),
      [](const T&) {},
      [](const auto&) {},
      [] {},
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnNext(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      std::forward<Function>(function),
      [](const auto&) {},
      [] {},
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnError(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [](const T&) {},
      std::forward<Function>(function),
      [] {},
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnComplete(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [](const T&) {},
      [](const auto&) {},
      std::forward<Function>(function),
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnTerminate(Function&& function) {
  auto sharedFunction = std::make_shared<std::decay_t<Function>>(
      std::forward<Function>(function));
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [](const T&) {},
      [sharedFunction](const auto&) { (*sharedFunction)(); },
      [sharedFunction]() { (*sharedFunction)(); },
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnEach(Function&& function) {
  auto sharedFunction = std::make_shared<std::decay_t<Function>>(
      std::forward<Function>(function));
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      [sharedFunction](const T&) { (*sharedFunction)(); },
      [sharedFunction](const auto&) { (*sharedFunction)(); },
      [sharedFunction]() { (*sharedFunction)(); },
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename OnNextFunc, typename OnCompleteFunc, typename, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOn(
    OnNextFunc&& onNext,
    OnCompleteFunc&& onComplete) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      std::forward<OnNextFunc>(onNext),
      [](const auto&) {},
      std::forward<OnCompleteFunc>(onComplete),
      [](const auto&) {}, // onRequest
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
std::shared_ptr<Flowable<T>> Flowable<T>::doOn(
    OnNextFunc&& onNext,
    OnCompleteFunc&& onComplete,
    OnErrorFunc&& onError) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {},
      std::forward<OnNextFunc>(onNext),
      std::forward<OnErrorFunc>(onError),
      std::forward<OnCompleteFunc>(onComplete),
      [](const auto&) {}, // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnRequest(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {}, // onSubscribe
      [](const auto&) {}, // onNext
      [](const auto&) {}, // onError
      [] {}, // onComplete
      std::forward<Function>(function), // onRequest
      [] {}); // onCancel
}

template <typename T>
template <typename Function, typename>
std::shared_ptr<Flowable<T>> Flowable<T>::doOnCancel(Function&& function) {
  return details::createDoOperator(
      ref_from_this(this),
      [] {}, // onSubscribe
      [](const auto&) {}, // onNext
      [](const auto&) {}, // onError
      [] {}, // onComplete
      [](const auto&) {}, // onRequest
      std::forward<Function>(function)); // onCancel
}

template <typename T>
template <typename ExceptionGenerator>
std::shared_ptr<Flowable<T>> Flowable<T>::timeout(
    folly::EventBase& timerEvb,
    std::chrono::milliseconds starvationTimeout,
    std::chrono::milliseconds initTimeout,
    ExceptionGenerator&& exnGen) {
  return std::make_shared<details::TimeoutOperator<T, ExceptionGenerator>>(
      ref_from_this(this),
      timerEvb,
      starvationTimeout,
      initTimeout,
      std::forward<ExceptionGenerator>(exnGen));
}

} // namespace flowable
} // namespace yarpl
