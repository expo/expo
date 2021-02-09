// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once
#include <folly/executors/GlobalExecutor.h>
#include <folly/experimental/coro/AsyncGenerator.h>
#include <folly/experimental/coro/Baton.h>
#include <folly/experimental/coro/Task.h>
#include <folly/experimental/coro/WithCancellation.h>
#include <memory>
#include "yarpl/flowable/Flowable.h"

namespace yarpl {
namespace detail {
template <typename T>
class AsyncGeneratorShim {
 public:
  AsyncGeneratorShim(
      folly::coro::AsyncGenerator<T&&>&& generator,
      folly::SequencedExecutor* ex)
      : generator_(std::move(generator)),
        sharedState_(std::make_shared<SharedState>()) {
    sharedState_->executor_ = folly::getKeepAliveToken(ex);
  }

  void subscribe(
      std::shared_ptr<yarpl::flowable::Subscriber<T>> subscriber) && {
    class Subscription : public yarpl::flowable::Subscription {
     public:
      explicit Subscription(std::weak_ptr<SharedState> state)
          : state_(std::move(state)) {}

      void request(int64_t n) override {
        if (auto state = state_.lock()) {
          state->executor_->add([n, state = std::move(state)]() {
            if (state->requested_ == credits::kNoFlowControl ||
                n == credits::kNoFlowControl) {
              state->requested_ = credits::kNoFlowControl;
            } else {
              state->requested_ += n;
            }
            state->baton_.post();
          });
        }
      }

      void cancel() override {
        if (auto state = state_.lock()) {
          state->executor_->add([state = std::move(state)]() {
            // requestCancellation will execute registered CancellationCallback
            // inline, but CancellationCallback should be run in
            // executor_ thread
            state->cancelSource_.requestCancellation();
            state->baton_.post();
          });
        }
      }

     private:
      std::weak_ptr<SharedState> state_;
    };
    sharedState_->executor_->add(
        [keepAlive = sharedState_->executor_.copy(),
         subscriber,
         subscription = std::make_shared<Subscription>(
             std::weak_ptr<SharedState>(sharedState_))]() mutable {
          subscriber->onSubscribe(std::move(subscription));
        });
    auto executor = sharedState_->executor_.get();
    folly::coro::co_withCancellation(
        sharedState_->cancelSource_.getToken(),
        folly::coro::co_invoke(
            [subscriber = std::move(subscriber),
             self = std::move(*this)]() mutable -> folly::coro::Task<void> {
              while (true) {
                while (self.sharedState_->requested_ == 0 &&
                       !self.sharedState_->cancelSource_
                            .isCancellationRequested()) {
                  co_await self.sharedState_->baton_;
                  self.sharedState_->baton_.reset();
                }

                if (self.sharedState_->cancelSource_
                        .isCancellationRequested()) {
                  self.sharedState_->executor_->add(
                      [subscriber = std::move(subscriber)]() {
                        // destory subscriber on executor_ thread
                      });
                  co_return;
                }

                folly::Try<T> value;
                try {
                  auto item = co_await self.generator_.next();

                  if (item.has_value()) {
                    value.emplace(std::move(*item));
                  }
                } catch (const std::exception& ex) {
                  value.emplaceException(std::current_exception(), ex);
                } catch (...) {
                  value.emplaceException(std::current_exception());
                }

                if (value.hasValue()) {
                  self.sharedState_->executor_->add(
                      [subscriber,
                       keepAlive = self.sharedState_->executor_.copy(),
                       value = std::move(value)]() mutable {
                        subscriber->onNext(std::move(value).value());
                      });
                } else if (value.hasException()) {
                  self.sharedState_->executor_->add(
                      [subscriber = std::move(subscriber),
                       keepAlive = self.sharedState_->executor_.copy(),
                       value = std::move(value)]() mutable {
                        subscriber->onError(std::move(value).exception());
                      });
                  co_return;
                } else {
                  self.sharedState_->executor_->add(
                      [subscriber = std::move(subscriber),
                       keepAlive =
                           self.sharedState_->executor_.copy()]() mutable {
                        subscriber->onComplete();
                      });
                  co_return;
                }

                if (self.sharedState_->requested_ != credits::kNoFlowControl) {
                  self.sharedState_->requested_--;
                }
              }
            }))
        .scheduleOn(std::move(executor))
        .start();
  }

 private:
  struct SharedState {
    SharedState() = default;
    explicit SharedState(folly::CancellationSource source)
        : cancelSource_(std::move(source)) {}
    folly::Executor::KeepAlive<folly::SequencedExecutor> executor_;
    int64_t requested_{0};
    folly::coro::Baton baton_{0};
    folly::CancellationSource cancelSource_;
  };

  folly::coro::AsyncGenerator<T&&> generator_;
  std::shared_ptr<SharedState> sharedState_;
};
} // namespace detail

template <typename T>
std::shared_ptr<yarpl::flowable::Flowable<T>> toFlowable(
    folly::coro::AsyncGenerator<T&&> gen,
    folly::SequencedExecutor* ex = folly::getEventBase()) {
  return yarpl::flowable::internal::flowableFromSubscriber<T>(
      [gen = std::move(gen),
       ex](std::shared_ptr<yarpl::flowable::Subscriber<T>> subscriber) mutable {
        detail::AsyncGeneratorShim<T>(std::move(gen), ex)
            .subscribe(std::move(subscriber));
      });
}
} // namespace yarpl
