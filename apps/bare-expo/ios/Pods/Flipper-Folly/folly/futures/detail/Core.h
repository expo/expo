/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <atomic>
#include <mutex>
#include <stdexcept>
#include <utility>
#include <vector>

#include <boost/variant.hpp>

#include <folly/Executor.h>
#include <folly/Function.h>
#include <folly/Optional.h>
#include <folly/ScopeGuard.h>
#include <folly/Try.h>
#include <folly/Utility.h>
#include <folly/futures/detail/Types.h>
#include <folly/lang/Assume.h>
#include <folly/lang/Exception.h>
#include <folly/synchronization/AtomicUtil.h>
#include <folly/synchronization/MicroSpinLock.h>
#include <glog/logging.h>

#include <folly/io/async/Request.h>

namespace folly {
namespace futures {
namespace detail {

/// See `Core` for details
enum class State : uint8_t {
  Start = 1 << 0,
  OnlyResult = 1 << 1,
  OnlyCallback = 1 << 2,
  OnlyCallbackAllowInline = 1 << 3,
  Proxy = 1 << 4,
  Done = 1 << 5,
  Empty = 1 << 6,
};
constexpr State operator&(State a, State b) {
  return State(uint8_t(a) & uint8_t(b));
}
constexpr State operator|(State a, State b) {
  return State(uint8_t(a) | uint8_t(b));
}
constexpr State operator^(State a, State b) {
  return State(uint8_t(a) ^ uint8_t(b));
}
constexpr State operator~(State a) {
  return State(~uint8_t(a));
}

/// SpinLock is and must stay a 1-byte object because of how Core is laid out.
struct SpinLock : private MicroSpinLock {
  SpinLock() : MicroSpinLock{0} {}

  using MicroSpinLock::lock;
  using MicroSpinLock::unlock;
};
static_assert(sizeof(SpinLock) == 1, "missized");

class DeferredExecutor;

class UniqueDeleter {
 public:
  void operator()(DeferredExecutor* ptr);
};

using DeferredWrapper = std::unique_ptr<DeferredExecutor, UniqueDeleter>;

/**
 * Wrapper type that represents either a KeepAlive or a DeferredExecutor.
 * Acts as if a type-safe tagged union of the two using knowledge that the two
 * can safely be distinguished.
 */
class KeepAliveOrDeferred {
 public:
  KeepAliveOrDeferred(Executor::KeepAlive<> ka) : storage_{std::move(ka)} {
    DCHECK(!isDeferred());
  }

  KeepAliveOrDeferred(DeferredWrapper deferred)
      : storage_{std::move(deferred)} {}

  KeepAliveOrDeferred() {}

  ~KeepAliveOrDeferred() {}

  KeepAliveOrDeferred(KeepAliveOrDeferred&& other)
      : storage_{std::move(other.storage_)} {}

  KeepAliveOrDeferred& operator=(KeepAliveOrDeferred&& other) {
    storage_ = std::move(other.storage_);
    return *this;
  }

  DeferredExecutor* getDeferredExecutor() const {
    if (!isDeferred()) {
      return nullptr;
    }
    return asDeferred().get();
  }

  Executor* getKeepAliveExecutor() const {
    if (isDeferred()) {
      return nullptr;
    }
    return asKeepAlive().get();
  }

  Executor::KeepAlive<> stealKeepAlive() && {
    if (isDeferred()) {
      return Executor::KeepAlive<>{};
    }
    return std::move(asKeepAlive());
  }

  std::unique_ptr<DeferredExecutor, UniqueDeleter> stealDeferred() && {
    if (!isDeferred()) {
      return std::unique_ptr<DeferredExecutor, UniqueDeleter>{};
    }
    return std::move(asDeferred());
  }

  bool isDeferred() const {
    return boost::get<DeferredWrapper>(&storage_) != nullptr;
  }

  bool isKeepAlive() const {
    return !isDeferred();
  }

  KeepAliveOrDeferred copy() const;

  explicit operator bool() const {
    return getDeferredExecutor() || getKeepAliveExecutor();
  }

 private:
  boost::variant<DeferredWrapper, Executor::KeepAlive<>> storage_;

  friend class DeferredExecutor;

  Executor::KeepAlive<>& asKeepAlive() {
    return boost::get<Executor::KeepAlive<>>(storage_);
  }

  const Executor::KeepAlive<>& asKeepAlive() const {
    return boost::get<Executor::KeepAlive<>>(storage_);
  }

  DeferredWrapper& asDeferred() {
    return boost::get<DeferredWrapper>(storage_);
  }

  const DeferredWrapper& asDeferred() const {
    return boost::get<DeferredWrapper>(storage_);
  }
};

/**
 * Defer work until executor is actively boosted.
 */
class DeferredExecutor final {
 public:
  // addFrom will:
  //  * run func inline if there is a stored executor and completingKA matches
  //    the stored executor
  //  * enqueue func into the stored executor if one exists
  //  * store func until an executor is set otherwise
  void addFrom(
      Executor::KeepAlive<>&& completingKA,
      Executor::KeepAlive<>::KeepAliveFunc func) {
    auto state = state_.load(std::memory_order_acquire);
    if (state == State::DETACHED) {
      return;
    }

    // If we are completing on the current executor, call inline, otherwise
    // add
    auto addWithInline =
        [&](Executor::KeepAlive<>::KeepAliveFunc&& addFunc) mutable {
          if (completingKA.get() == executor_.get()) {
            addFunc(std::move(completingKA));
          } else {
            executor_.copy().add(std::move(addFunc));
          }
        };

    if (state == State::HAS_EXECUTOR) {
      addWithInline(std::move(func));
      return;
    }
    DCHECK(state == State::EMPTY);
    func_ = std::move(func);
    if (folly::atomic_compare_exchange_strong_explicit(
            &state_,
            &state,
            State::HAS_FUNCTION,
            std::memory_order_release,
            std::memory_order_acquire)) {
      return;
    }
    DCHECK(state == State::DETACHED || state == State::HAS_EXECUTOR);
    if (state == State::DETACHED) {
      std::exchange(func_, nullptr);
      return;
    }
    addWithInline(std::exchange(func_, nullptr));
  }

  Executor* getExecutor() const {
    assert(executor_.get());
    return executor_.get();
  }

  void setExecutor(folly::Executor::KeepAlive<> executor) {
    if (nestedExecutors_) {
      auto nestedExecutors = std::exchange(nestedExecutors_, nullptr);
      for (auto& nestedExecutor : *nestedExecutors) {
        assert(nestedExecutor.get());
        nestedExecutor.get()->setExecutor(executor.copy());
      }
    }
    executor_ = std::move(executor);
    auto state = state_.load(std::memory_order_acquire);
    if (state == State::EMPTY &&
        folly::atomic_compare_exchange_strong_explicit(
            &state_,
            &state,
            State::HAS_EXECUTOR,
            std::memory_order_release,
            std::memory_order_acquire)) {
      return;
    }

    DCHECK(state == State::HAS_FUNCTION);
    state_.store(State::HAS_EXECUTOR, std::memory_order_release);
    executor_.copy().add(std::exchange(func_, nullptr));
  }

  void setNestedExecutors(std::vector<DeferredWrapper> executors) {
    DCHECK(!nestedExecutors_);
    nestedExecutors_ =
        std::make_unique<std::vector<DeferredWrapper>>(std::move(executors));
  }

  void detach() {
    if (nestedExecutors_) {
      auto nestedExecutors = std::exchange(nestedExecutors_, nullptr);
      for (auto& nestedExecutor : *nestedExecutors) {
        assert(nestedExecutor.get());
        nestedExecutor.get()->detach();
      }
    }
    auto state = state_.load(std::memory_order_acquire);
    if (state == State::EMPTY &&
        folly::atomic_compare_exchange_strong_explicit(
            &state_,
            &state,
            State::DETACHED,
            std::memory_order_release,
            std::memory_order_acquire)) {
      return;
    }

    DCHECK(state == State::HAS_FUNCTION);
    state_.store(State::DETACHED, std::memory_order_release);
    std::exchange(func_, nullptr);
  }

  DeferredWrapper copy() {
    acquire();
    return DeferredWrapper(this);
  }

  static DeferredWrapper create() {
    return DeferredWrapper(new DeferredExecutor{});
  }

 private:
  DeferredExecutor() {}
  friend class UniqueDeleter;

  bool acquire() {
    auto keepAliveCount =
        keepAliveCount_.fetch_add(1, std::memory_order_relaxed);
    DCHECK(keepAliveCount > 0);
    return true;
  }

  void release() {
    auto keepAliveCount =
        keepAliveCount_.fetch_sub(1, std::memory_order_acq_rel);
    DCHECK(keepAliveCount > 0);
    if (keepAliveCount == 1) {
      delete this;
    }
  }

  enum class State { EMPTY, HAS_FUNCTION, HAS_EXECUTOR, DETACHED };
  std::atomic<State> state_{State::EMPTY};
  Executor::KeepAlive<>::KeepAliveFunc func_;
  folly::Executor::KeepAlive<> executor_;
  std::unique_ptr<std::vector<DeferredWrapper>> nestedExecutors_;
  std::atomic<ssize_t> keepAliveCount_{1};
};

inline void UniqueDeleter::operator()(DeferredExecutor* ptr) {
  if (ptr) {
    ptr->release();
  }
}

inline KeepAliveOrDeferred KeepAliveOrDeferred::copy() const {
  if (isDeferred()) {
    if (auto def = getDeferredExecutor()) {
      return KeepAliveOrDeferred{def->copy()};
    } else {
      return KeepAliveOrDeferred{};
    }
  } else {
    return KeepAliveOrDeferred{asKeepAlive()};
  }
}

/// The shared state object for Future and Promise.
///
/// Nomenclature:
///
/// - "result": a `Try` object which, when set, contains a `T` or exception.
/// - "move-out the result": used to mean the `Try` object and/or its contents
///   are moved-out by a move-constructor or move-assignment. After the result
///   is set, Core itself never modifies (including moving out) the result;
///   however the docs refer to both since caller-code can move-out the result
///   implicitly (see below for examples) whereas other types of modifications
///   are more explicit in the caller code.
/// - "callback": a function provided by the future which Core may invoke. The
///   thread in which the callback is invoked depends on the executor; if there
///   is no executor or an inline executor the thread-choice depends on timing.
/// - "executor": an object which may in the future invoke a provided function
///   (some executors may, as a matter of policy, simply destroy provided
///   functions without executing them).
/// - "consumer thread": the thread which currently owns the Future and which
///   may provide the callback and/or the interrupt.
/// - "producer thread": the thread which owns the Future and which may provide
///   the result and which may provide the interrupt handler.
/// - "interrupt": if provided, an object managed by (if non-empty)
///   `exception_wrapper`.
/// - "interrupt handler": if provided, a function-object passed to
///   `promise.setInterruptHandler()`. Core invokes the interrupt handler with
///   the interrupt when both are provided (and, best effort, if there is not
///   yet any result).
///
/// Core holds three sets of data, each of which is concurrency-controlled:
///
/// - The primary producer-to-consumer info-flow: this info includes the result,
///   callback, executor, and a priority for running the callback. Management of
///   and concurrency control for this info is by an FSM based on `enum class
///   State`. All state transitions are atomic; other producer-to-consumer data
///   is sometimes modified within those transitions; see below for details.
/// - The consumer-to-producer interrupt-request flow: this info includes an
///   interrupt-handler and an interrupt. Concurrency of this info is controlled
///   by a Spin Lock (`interruptLock_`).
/// - Lifetime control info: this includes two reference counts, both which are
///   internally synchronized (atomic).
///
/// The FSM to manage the primary producer-to-consumer info-flow has these
///   allowed (atomic) transitions:
///
///   +----------------------------------------------------------------+
///   |                       ---> OnlyResult -----                    |
///   |                     /                       \                  |
///   |                  (setResult())             (setCallback())     |
///   |                   /                           \                |
///   |   Start --------->                              ------> Done   |
///   |     \             \                           /                |
///   |      \           (setCallback())           (setResult())       |
///   |       \             \                       /                  |
///   |        \              ---> OnlyCallback ---                    |
///   |        \            or OnlyCallbackAllowInline                 |
///   |         \                                   \                  |
///   |     (setProxy())                           (setProxy())        |
///   |           \                                   \                |
///   |            \                                    ------> Empty  |
///   |             \                                 /                |
///   |              \                             (setCallback())     |
///   |               \                             /                  |
///   |                 ---------> Proxy ----------                    |
///   +----------------------------------------------------------------+
///
/// States and the corresponding producer-to-consumer data status & ownership:
///
/// - Start: has neither result nor callback. While in this state, the producer
///   thread may set the result (`setResult()`) or the consumer thread may set
///   the callback (`setCallback()`).
/// - OnlyResult: producer thread has set the result and must never access it.
///   The result is logically owned by, and possibly modified or moved-out by,
///   the consumer thread. Callers of the future object can do arbitrary
///   modifications, including moving-out, via continuations or via non-const
///   and/or rvalue-qualified `future.result()`, `future.value()`, etc.
///   Future/SemiFuture proper also move-out the result in some cases, e.g.,
///   in `wait()`, `get()`, when passing through values or results from core to
///   core, as `then-value` and `then-error`, etc.
/// - OnlyCallback: consumer thread has set a callback/continuation. From this
///   point forward only the producer thread can safely access that callback
///   (see `setResult()` and `doCallback()` where the producer thread can both
///   read and modify the callback).
/// - OnlyCallbackAllowInline: as for OnlyCallback but the core is allowed to
///   run the callback inline with the setResult call, and therefore in the
///   execution context and on the executor that executed the callback on the
///   previous core, rather than adding the callback to the current Core's
///   executor. This will only happen if the executor on which the previous
///   callback is executing, and on which it is calling setResult, is the same
///   as the executor the current core would add the callback to.
/// - Proxy: producer thread has set a proxy core which the callback should be
///   proxied to.
/// - Done: callback can be safely accessed only within `doCallback()`, which
///   gets called on exactly one thread exactly once just after the transition
///   to Done. The future object will have determined whether that callback
///   has/will move-out the result, but either way the result remains logically
///   owned exclusively by the consumer thread (the code of Future/SemiFuture,
///   of the continuation, and/or of callers of `future.result()`, etc.).
/// - Empty: the core successfully proxied the callback and is now empty.
///
/// Start state:
///
/// - Start: e.g., `Core<X>::make()`.
/// - (See also `Core<X>::make(x)` which logically transitions Start =>
///   OnlyResult within the underlying constructor.)
///
/// Terminal states:
///
/// - OnlyResult: a terminal state when a callback is never attached, and also
///   sometimes when a callback is provided, e.g., sometimes when
///   `future.wait()` and/or `future.get()` are used.
/// - Done: a terminal state when `future.then()` is used, and sometimes also
///   when `future.wait()` and/or `future.get()` are used.
/// - Proxy: a terminal state if proxy core was set, but callback was never set.
/// - Empty: a terminal state when proxying a callback was successful.
///
/// Notes and caveats:
///
/// - Unfortunately, there are things that users can do to break concurrency and
///   we can't detect that. However users should be ok if they follow move
///   semantics religiously wrt threading.
/// - Futures and/or Promises can and usually will migrate between threads,
///   though this usually happens within the API code. For example, an async
///   operation will probably make a promise-future pair (see overloads of
///   `makePromiseContract()`), then move the Promise into another thread that
///   will eventually fulfill it.
/// - Things get slightly more complicated with executors and via, but the
///   principle is the same.
/// - In general, as long as the user doesn't access a future or promise object
///   from more than one thread at a time there won't be any problems.
template <typename T>
class Core final {
  static_assert(
      !std::is_void<T>::value,
      "void futures are not supported. Use Unit instead.");

 public:
  using Result = Try<T>;
  using Callback = folly::Function<void(Executor::KeepAlive<>&&, Result&&)>;

  /// State will be Start
  static Core* make() {
    return new Core();
  }

  /// State will be OnlyResult
  /// Result held will be move-constructed from `t`
  static Core* make(Try<T>&& t) {
    return new Core(std::move(t));
  }

  /// State will be OnlyResult
  /// Result held will be the `T` constructed from forwarded `args`
  template <typename... Args>
  static Core<T>* make(in_place_t, Args&&... args) {
    return new Core<T>(in_place, std::forward<Args>(args)...);
  }

  // not copyable
  Core(Core const&) = delete;
  Core& operator=(Core const&) = delete;

  // not movable (see comment in the implementation of Future::then)
  Core(Core&&) noexcept = delete;
  Core& operator=(Core&&) = delete;

  /// May call from any thread
  bool hasCallback() const noexcept {
    constexpr auto allowed =
        State::OnlyCallback | State::OnlyCallbackAllowInline | State::Done;
    auto const state = state_.load(std::memory_order_acquire);
    return State() != (state & allowed);
  }

  /// May call from any thread
  ///
  /// True if state is OnlyResult or Done.
  ///
  /// Identical to `this->ready()`
  bool hasResult() const noexcept {
    constexpr auto allowed = State::OnlyResult | State::Done;
    auto core = this;
    auto state = core->state_.load(std::memory_order_acquire);
    while (state == State::Proxy) {
      core = core->proxy_;
      state = core->state_.load(std::memory_order_acquire);
    }
    return State() != (state & allowed);
  }

  /// May call from any thread
  ///
  /// True if state is OnlyResult or Done.
  ///
  /// Identical to `this->hasResult()`
  bool ready() const noexcept {
    return hasResult();
  }

  /// Call only from consumer thread (since the consumer thread can modify the
  ///   referenced Try object; see non-const overloads of `future.result()`,
  ///   etc., and certain Future-provided callbacks which move-out the result).
  ///
  /// Unconditionally returns a reference to the result.
  ///
  /// State dependent preconditions:
  ///
  /// - Start, OnlyCallback or OnlyCallbackAllowInline: Never safe - do not
  /// call. (Access in those states
  ///   would be undefined behavior since the producer thread can, in those
  ///   states, asynchronously set the referenced Try object.)
  /// - OnlyResult: Always safe. (Though the consumer thread should not use the
  ///   returned reference after it attaches a callback unless it knows that
  ///   the callback does not move-out the referenced result.)
  /// - Done: Safe but sometimes unusable. (Always returns a valid reference,
  ///   but the referenced result may or may not have been modified, including
  ///   possibly moved-out, depending on what the callback did; some but not
  ///   all callbacks modify (possibly move-out) the result.)
  Try<T>& getTry() {
    DCHECK(hasResult());
    auto core = this;
    while (core->state_.load(std::memory_order_relaxed) == State::Proxy) {
      core = core->proxy_;
    }
    return core->result_;
  }
  Try<T> const& getTry() const {
    DCHECK(hasResult());
    auto core = this;
    while (core->state_.load(std::memory_order_relaxed) == State::Proxy) {
      core = core->proxy_;
    }
    return core->result_;
  }

  /// Call only from consumer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// If it transitions to Done, synchronously initiates a call to the callback,
  /// and might also synchronously execute that callback (e.g., if there is no
  /// executor or if the executor is inline).
  void setCallback(
      Callback&& func,
      std::shared_ptr<folly::RequestContext>&& context,
      futures::detail::InlineContinuation allowInline) {
    DCHECK(!hasCallback());

    ::new (&callback_) Callback(std::move(func));
    ::new (&context_) Context(std::move(context));

    auto state = state_.load(std::memory_order_acquire);
    State nextState = allowInline == futures::detail::InlineContinuation::permit
        ? State::OnlyCallbackAllowInline
        : State::OnlyCallback;

    if (state == State::Start) {
      if (folly::atomic_compare_exchange_strong_explicit(
              &state_,
              &state,
              nextState,
              std::memory_order_release,
              std::memory_order_acquire)) {
        return;
      }
      assume(state == State::OnlyResult || state == State::Proxy);
    }

    if (state == State::OnlyResult) {
      state_.store(State::Done, std::memory_order_relaxed);
      doCallback(Executor::KeepAlive<>{}, state);
      return;
    }

    if (state == State::Proxy) {
      return proxyCallback(state);
    }

    terminate_with<std::logic_error>("setCallback unexpected state");
  }

  /// Call only from producer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// This can not be called concurrently with setResult().
  void setProxy(Core* proxy) {
    DCHECK(!hasResult());

    proxy_ = proxy;

    auto state = state_.load(std::memory_order_acquire);
    switch (state) {
      case State::Start:
        if (folly::atomic_compare_exchange_strong_explicit(
                &state_,
                &state,
                State::Proxy,
                std::memory_order_release,
                std::memory_order_acquire)) {
          break;
        }
        assume(
            state == State::OnlyCallback ||
            state == State::OnlyCallbackAllowInline);
        FOLLY_FALLTHROUGH;

      case State::OnlyCallback:
      case State::OnlyCallbackAllowInline:
        proxyCallback(state);
        break;
      case State::OnlyResult:
      case State::Proxy:
      case State::Done:
      case State::Empty:
      default:
        terminate_with<std::logic_error>("setCallback unexpected state");
    }

    detachOne();
  }

  /// Call only from producer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// If it transitions to Done, synchronously initiates a call to the callback,
  /// and might also synchronously execute that callback (e.g., if there is no
  /// executor or if the executor is inline).
  void setResult(Try<T>&& t) {
    setResult(Executor::KeepAlive<>{}, std::move(t));
  }

  /// Call only from producer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// If it transitions to Done, synchronously initiates a call to the callback,
  /// and might also synchronously execute that callback (e.g., if there is no
  /// executor, if the executor is inline or if completingKA represents the
  /// same executor as does executor_).
  void setResult(Executor::KeepAlive<>&& completingKA, Try<T>&& t) {
    DCHECK(!hasResult());

    ::new (&result_) Result(std::move(t));

    auto state = state_.load(std::memory_order_acquire);
    switch (state) {
      case State::Start:
        if (folly::atomic_compare_exchange_strong_explicit(
                &state_,
                &state,
                State::OnlyResult,
                std::memory_order_release,
                std::memory_order_acquire)) {
          return;
        }
        assume(
            state == State::OnlyCallback ||
            state == State::OnlyCallbackAllowInline);
        FOLLY_FALLTHROUGH;

      case State::OnlyCallback:
      case State::OnlyCallbackAllowInline:
        state_.store(State::Done, std::memory_order_relaxed);
        doCallback(std::move(completingKA), state);
        return;
      case State::OnlyResult:
      case State::Proxy:
      case State::Done:
      case State::Empty:
      default:
        terminate_with<std::logic_error>("setResult unexpected state");
    }
  }

  /// Called by a destructing Future (in the consumer thread, by definition).
  /// Calls `delete this` if there are no more references to `this`
  /// (including if `detachPromise()` is called previously or concurrently).
  void detachFuture() noexcept {
    detachOne();
  }

  /// Called by a destructing Promise (in the producer thread, by definition).
  /// Calls `delete this` if there are no more references to `this`
  /// (including if `detachFuture()` is called previously or concurrently).
  void detachPromise() noexcept {
    DCHECK(hasResult());
    detachOne();
  }

  /// Call only from consumer thread, either before attaching a callback or
  /// after the callback has already been invoked, but not concurrently with
  /// anything which might trigger invocation of the callback.
  void setExecutor(KeepAliveOrDeferred&& x) {
    DCHECK(
        state_ != State::OnlyCallback &&
        state_ != State::OnlyCallbackAllowInline);
    executor_ = std::move(x);
  }

  Executor* getExecutor() const {
    if (!executor_.isKeepAlive()) {
      return nullptr;
    }
    return executor_.getKeepAliveExecutor();
  }

  DeferredExecutor* getDeferredExecutor() const {
    if (!executor_.isDeferred()) {
      return {};
    }

    return executor_.getDeferredExecutor();
  }

  DeferredWrapper stealDeferredExecutor() {
    if (executor_.isKeepAlive()) {
      return {};
    }

    return std::move(executor_).stealDeferred();
  }

  /// Call only from consumer thread
  ///
  /// Eventual effect is to pass `e` to the Promise's interrupt handler, either
  /// synchronously within this call or asynchronously within
  /// `setInterruptHandler()`, depending on which happens first (a coin-toss if
  /// the two calls are racing).
  ///
  /// Has no effect if it was called previously.
  /// Has no effect if State is OnlyResult or Done.
  void raise(exception_wrapper e) {
    std::lock_guard<SpinLock> lock(interruptLock_);
    if (!interrupt_ && !hasResult()) {
      interrupt_ = std::make_unique<exception_wrapper>(std::move(e));
      if (interruptHandler_) {
        interruptHandler_(*interrupt_);
      }
    }
  }

  std::function<void(exception_wrapper const&)> getInterruptHandler() {
    if (!interruptHandlerSet_.load(std::memory_order_acquire)) {
      return nullptr;
    }
    std::lock_guard<SpinLock> lock(interruptLock_);
    return interruptHandler_;
  }

  /// Call only from producer thread
  ///
  /// May invoke `fn()` (passing the interrupt) synchronously within this call
  /// (if `raise()` preceded or perhaps if `raise()` is called concurrently).
  ///
  /// Has no effect if State is OnlyResult or Done.
  ///
  /// Note: `fn()` must not touch resources that are destroyed immediately after
  ///   `setResult()` is called. Reason: it is possible for `fn()` to get called
  ///   asynchronously (in the consumer thread) after the producer thread calls
  ///   `setResult()`.
  template <typename F>
  void setInterruptHandler(F&& fn) {
    std::lock_guard<SpinLock> lock(interruptLock_);
    if (!hasResult()) {
      if (interrupt_) {
        fn(as_const(*interrupt_));
      } else {
        setInterruptHandlerNoLock(std::forward<F>(fn));
      }
    }
  }

  void setInterruptHandlerNoLock(
      std::function<void(exception_wrapper const&)> fn) {
    interruptHandlerSet_.store(true, std::memory_order_relaxed);
    interruptHandler_ = std::move(fn);
  }

 private:
  Core() : state_(State::Start), attached_(2) {}

  explicit Core(Try<T>&& t)
      : result_(std::move(t)), state_(State::OnlyResult), attached_(1) {}

  template <typename... Args>
  explicit Core(in_place_t, Args&&... args) noexcept(
      std::is_nothrow_constructible<T, Args&&...>::value)
      : result_(in_place, std::forward<Args>(args)...),
        state_(State::OnlyResult),
        attached_(1) {}

  ~Core() {
    DCHECK(attached_ == 0);
    auto state = state_.load(std::memory_order_relaxed);
    switch (state) {
      case State::OnlyResult:
        FOLLY_FALLTHROUGH;

      case State::Done:
        result_.~Result();
        break;

      case State::Proxy:
        proxy_->detachFuture();
        break;

      case State::Empty:
        break;

      case State::Start:
      case State::OnlyCallback:
      case State::OnlyCallbackAllowInline:
      default:
        terminate_with<std::logic_error>("~Core unexpected state");
    }
  }

  // Helper class that stores a pointer to the `Core` object and calls
  // `derefCallback` and `detachOne` in the destructor.
  class CoreAndCallbackReference {
   public:
    explicit CoreAndCallbackReference(Core* core) noexcept : core_(core) {}

    ~CoreAndCallbackReference() noexcept {
      detach();
    }

    CoreAndCallbackReference(CoreAndCallbackReference const& o) = delete;
    CoreAndCallbackReference& operator=(CoreAndCallbackReference const& o) =
        delete;
    CoreAndCallbackReference& operator=(CoreAndCallbackReference&&) = delete;

    CoreAndCallbackReference(CoreAndCallbackReference&& o) noexcept
        : core_(std::exchange(o.core_, nullptr)) {}

    Core* getCore() const noexcept {
      return core_;
    }

   private:
    void detach() noexcept {
      if (core_) {
        core_->derefCallback();
        core_->detachOne();
      }
    }

    Core* core_{nullptr};
  };

  // May be called at most once.
  void doCallback(Executor::KeepAlive<>&& completingKA, State priorState) {
    DCHECK(state_ == State::Done);

    auto executor = std::exchange(executor_, KeepAliveOrDeferred{});

    // Customise inline behaviour
    // If addCompletingKA is non-null, then we are allowing inline execution
    auto doAdd = [](Executor::KeepAlive<>&& addCompletingKA,
                    KeepAliveOrDeferred&& currentExecutor,
                    auto&& keepAliveFunc) mutable {
      if (auto deferredExecutorPtr = currentExecutor.getDeferredExecutor()) {
        deferredExecutorPtr->addFrom(
            std::move(addCompletingKA), std::move(keepAliveFunc));
      } else {
        // If executors match call inline
        auto currentKeepAlive = std::move(currentExecutor).stealKeepAlive();
        if (addCompletingKA.get() == currentKeepAlive.get()) {
          keepAliveFunc(std::move(currentKeepAlive));
        } else {
          std::move(currentKeepAlive).add(std::move(keepAliveFunc));
        }
      }
    };

    if (executor) {
      // If we are not allowing inline, clear the completing KA to disallow
      if (!(priorState == State::OnlyCallbackAllowInline)) {
        completingKA = Executor::KeepAlive<>{};
      }
      exception_wrapper ew;
      // We need to reset `callback_` after it was executed (which can happen
      // through the executor or, if `Executor::add` throws, below). The
      // executor might discard the function without executing it (now or
      // later), in which case `callback_` also needs to be reset.
      // The `Core` has to be kept alive throughout that time, too. Hence we
      // increment `attached_` and `callbackReferences_` by two, and construct
      // exactly two `CoreAndCallbackReference` objects, which call
      // `derefCallback` and `detachOne` in their destructor. One will guard
      // this scope, the other one will guard the lambda passed to the executor.
      attached_.fetch_add(2, std::memory_order_relaxed);
      callbackReferences_.fetch_add(2, std::memory_order_relaxed);
      CoreAndCallbackReference guard_local_scope(this);
      CoreAndCallbackReference guard_lambda(this);
      try {
        doAdd(
            std::move(completingKA),
            std::move(executor),
            [core_ref =
                 std::move(guard_lambda)](Executor::KeepAlive<>&& ka) mutable {
              auto cr = std::move(core_ref);
              Core* const core = cr.getCore();
              RequestContextScopeGuard rctx(std::move(core->context_));
              core->callback_(std::move(ka), std::move(core->result_));
            });
      } catch (const std::exception& e) {
        ew = exception_wrapper(std::current_exception(), e);
      } catch (...) {
        ew = exception_wrapper(std::current_exception());
      }
      if (ew) {
        RequestContextScopeGuard rctx(std::move(context_));
        result_ = Try<T>(std::move(ew));
        callback_(Executor::KeepAlive<>{}, std::move(result_));
      }
    } else {
      attached_.fetch_add(1, std::memory_order_relaxed);
      SCOPE_EXIT {
        context_.~Context();
        callback_.~Callback();
        detachOne();
      };
      RequestContextScopeGuard rctx(std::move(context_));
      callback_(std::move(completingKA), std::move(result_));
    }
  }

  void proxyCallback(State priorState) {
    // If the state of the core being proxied had a callback that allows inline
    // execution, maintain this information in the proxy
    futures::detail::InlineContinuation allowInline =
        (priorState == State::OnlyCallbackAllowInline
             ? futures::detail::InlineContinuation::permit
             : futures::detail::InlineContinuation::forbid);
    state_.store(State::Empty, std::memory_order_relaxed);
    proxy_->setExecutor(std::move(executor_));
    proxy_->setCallback(std::move(callback_), std::move(context_), allowInline);
    proxy_->detachFuture();
    context_.~Context();
    callback_.~Callback();
  }

  void detachOne() noexcept {
    auto a = attached_.fetch_sub(1, std::memory_order_acq_rel);
    assert(a >= 1);
    if (a == 1) {
      delete this;
    }
  }

  void derefCallback() noexcept {
    auto c = callbackReferences_.fetch_sub(1, std::memory_order_acq_rel);
    assert(c >= 1);
    if (c == 1) {
      context_.~Context();
      callback_.~Callback();
    }
  }

  using Context = std::shared_ptr<RequestContext>;

  union {
    Callback callback_;
  };
  // place result_ next to increase the likelihood that the value will be
  // contained entirely in one cache line
  union {
    Result result_;
    Core* proxy_;
  };
  std::atomic<State> state_;
  std::atomic<unsigned char> attached_;
  std::atomic<unsigned char> callbackReferences_{0};
  std::atomic<bool> interruptHandlerSet_{false};
  SpinLock interruptLock_;
  KeepAliveOrDeferred executor_;
  union {
    Context context_;
  };
  std::unique_ptr<exception_wrapper> interrupt_{};
  std::function<void(exception_wrapper const&)> interruptHandler_{nullptr};
};
} // namespace detail
} // namespace futures

} // namespace folly
