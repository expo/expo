// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/Portability.h>
#if FOLLY_HAS_COROUTINES
#include <folly/experimental/coro/Baton.h>
#include <folly/experimental/coro/Invoke.h>
#include <folly/experimental/coro/Task.h>
#endif
#include <folly/executors/SerialExecutor.h>

#include <thrift/lib/cpp2/async/ClientBufferedStream.h>
#include <thrift/lib/cpp2/async/ServerStream.h>
#include <yarpl/flowable/Flowable.h>

namespace yarpl {
namespace flowable {
class ThriftStreamShim {
 public:
#if FOLLY_HAS_COROUTINES
  template <typename T>
  static std::shared_ptr<yarpl::flowable::Flowable<T>> fromClientStream(
      apache::thrift::ClientBufferedStream<T>&& stream,
      folly::Executor::KeepAlive<> ex) {
    struct SharedState {
      SharedState(
          apache::thrift::detail::ClientStreamBridge::ClientPtr streamBridge,
          folly::Executor::KeepAlive<> ex)
          : streamBridge_(std::move(streamBridge)),
            ex_(folly::SerialExecutor::create(std::move(ex))) {}
      apache::thrift::detail::ClientStreamBridge::Ptr streamBridge_;
      folly::Executor::KeepAlive<folly::SequencedExecutor> ex_;
      std::atomic<bool> canceled_{false};
    };

    return yarpl::flowable::internal::flowableFromSubscriber<T>(
        [state =
             std::make_shared<SharedState>(std::move(stream.streamBridge_), ex),
         decode =
             stream.decode_](std::shared_ptr<yarpl::flowable::Subscriber<T>>
                                 subscriber) mutable {
          class Subscription : public yarpl::flowable::Subscription {
           public:
            explicit Subscription(std::weak_ptr<SharedState> state)
                : state_(std::move(state)) {}

            void request(int64_t n) override {
              CHECK(n != yarpl::credits::kNoFlowControl)
                  << "kNoFlowControl unsupported";

              if (auto state = state_.lock()) {
                state->ex_->add([n, state = std::move(state)]() {
                  state->streamBridge_->requestN(n);
                });
              }
            }

            void cancel() override {
              if (auto state = state_.lock()) {
                state->ex_->add([state = std::move(state)]() {
                  state->streamBridge_->cancel();
                  state->canceled_ = true;
                });
              }
            }

           private:
            std::weak_ptr<SharedState> state_;
          };

          state->ex_->add([keepAlive = state->ex_.copy(),
                           subscriber,
                           subscription = std::make_shared<Subscription>(
                               std::weak_ptr<SharedState>(state))]() mutable {
            subscriber->onSubscribe(std::move(subscription));
          });

          folly::coro::co_invoke(
              [subscriber = std::move(subscriber),
               state,
               decode]() mutable -> folly::coro::Task<void> {
                apache::thrift::detail::ClientStreamBridge::ClientQueue queue;
                class ReadyCallback
                    : public apache::thrift::detail::ClientStreamConsumer {
                 public:
                  void consume() override {
                    baton.post();
                  }

                  void canceled() override {
                    baton.post();
                  }

                  folly::coro::Baton baton;
                };

                while (!state->canceled_) {
                  if (queue.empty()) {
                    ReadyCallback callback;
                    if (state->streamBridge_->wait(&callback)) {
                      co_await callback.baton;
                    }
                    queue = state->streamBridge_->getMessages();
                    if (queue.empty()) {
                      // we've been cancelled
                      apache::thrift::detail::ClientStreamBridge::Ptr(
                          state->streamBridge_.release());
                      break;
                    }
                  }

                  {
                    auto& payload = queue.front();
                    if (!payload.hasValue() && !payload.hasException()) {
                      state->ex_->add([subscriber = std::move(subscriber),
                                       keepAlive = state->ex_.copy()] {
                        subscriber->onComplete();
                      });
                      break;
                    }
                    auto value = decode(std::move(payload));
                    queue.pop();
                    if (value.hasValue()) {
                      state->ex_->add([subscriber,
                                       keepAlive = state->ex_.copy(),
                                       value = std::move(value)]() mutable {
                        subscriber->onNext(std::move(value).value());
                      });
                    } else if (value.hasException()) {
                      state->ex_->add([subscriber = std::move(subscriber),
                                       keepAlive = state->ex_.copy(),
                                       value = std::move(value)]() mutable {
                        subscriber->onError(std::move(value).exception());
                      });
                      break;
                    } else {
                      LOG(FATAL) << "unreachable";
                    }
                  }
                }
              })
              .scheduleOn(state->ex_)
              .start();
        });
  }
#endif

  template <typename T>
  static apache::thrift::ServerStream<T> toServerStream(
      std::shared_ptr<Flowable<T>> flowable) {
    class StreamServerCallbackAdaptor final
        : public apache::thrift::StreamServerCallback,
          public Subscriber<T> {
     public:
      explicit StreamServerCallbackAdaptor(
          folly::Try<apache::thrift::StreamPayload> (*encode)(folly::Try<T>&&),
          folly::EventBase* eb)
          : encode_(encode), eb_(eb) {}
      // StreamServerCallback implementation
      bool onStreamRequestN(uint64_t tokens) override {
        if (!subscription_) {
          tokensBeforeSubscribe_ += tokens;
        } else {
          DCHECK_EQ(0, tokensBeforeSubscribe_);
          subscription_->request(tokens);
        }
        return clientCallback_;
      }
      void onStreamCancel() override {
        clientCallback_ = nullptr;
        if (auto subscription = std::move(subscription_)) {
          subscription->cancel();
        }
        self_.reset();
      }
      void resetClientCallback(
          apache::thrift::StreamClientCallback& clientCallback) override {
        clientCallback_ = &clientCallback;
      }

      // Subscriber implementation
      void onSubscribe(std::shared_ptr<Subscription> subscription) override {
        eb_->add([this, subscription = std::move(subscription)]() mutable {
          if (!clientCallback_) {
            return subscription->cancel();
          }

          subscription_ = std::move(subscription);
          if (auto tokens = std::exchange(tokensBeforeSubscribe_, 0)) {
            subscription_->request(tokens);
          }
        });
      }
      void onNext(T next) override {
        eb_->add([this, next = std::move(next), s = self_]() mutable {
          if (clientCallback_) {
            std::ignore =
                clientCallback_->onStreamNext(apache::thrift::StreamPayload{
                    encode_(folly::Try<T>(std::move(next))).value().payload,
                    {}});
          }
        });
      }
      void onError(folly::exception_wrapper ew) override {
        eb_->add([this, ew = std::move(ew), s = self_]() mutable {
          if (clientCallback_) {
            std::exchange(clientCallback_, nullptr)
                ->onStreamError(
                    encode_(folly::Try<T>(std::move(ew))).exception());
            self_.reset();
          }
        });
      }
      void onComplete() override {
        eb_->add([this, s = self_] {
          if (clientCallback_) {
            std::exchange(clientCallback_, nullptr)->onStreamComplete();
            self_.reset();
          }
        });
      }

      void takeRef(std::shared_ptr<StreamServerCallbackAdaptor> self) {
        self_ = std::move(self);
      }

     private:
      apache::thrift::StreamClientCallback* clientCallback_{nullptr};
      std::shared_ptr<Subscription> subscription_;
      uint32_t tokensBeforeSubscribe_{0};
      folly::Try<apache::thrift::StreamPayload> (*encode_)(folly::Try<T>&&);
      folly::EventBase* eb_;
      std::shared_ptr<StreamServerCallbackAdaptor> self_;
    };

    return apache::thrift::ServerStream<T>(
        [flowable = std::move(flowable)](
            folly::Executor::KeepAlive<>,
            folly::Try<apache::thrift::StreamPayload> (*encode)(
                folly::Try<T> &&)) mutable {
          return [flowable = std::move(flowable), encode](
                     apache::thrift::FirstResponsePayload&& payload,
                     apache::thrift::StreamClientCallback* callback,
                     folly::EventBase* clientEb) mutable {
            auto stream =
                std::make_shared<StreamServerCallbackAdaptor>(encode, clientEb);
            stream->takeRef(stream);
            stream->resetClientCallback(*callback);
            std::ignore = callback->onFirstResponse(
                std::move(payload), clientEb, stream.get());
            flowable->subscribe(std::move(stream));
          };
        });
  }
};
} // namespace flowable
} // namespace yarpl
