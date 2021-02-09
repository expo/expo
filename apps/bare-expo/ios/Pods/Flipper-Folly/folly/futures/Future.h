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

#include <algorithm>
#include <exception>
#include <functional>
#include <memory>
#include <type_traits>
#include <utility>
#include <vector>

#include <folly/Optional.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/Try.h>
#include <folly/Unit.h>
#include <folly/Utility.h>
#include <folly/executors/DrivableExecutor.h>
#include <folly/executors/TimedDrivableExecutor.h>
#include <folly/functional/Invoke.h>
#include <folly/futures/Portability.h>
#include <folly/futures/Promise.h>
#include <folly/futures/detail/Types.h>
#include <folly/lang/Exception.h>

#if FOLLY_HAS_COROUTINES
#include <folly/experimental/coro/Traits.h>
#include <experimental/coroutine>
#endif

// boring predeclarations and details
#include <folly/futures/Future-pre.h>

namespace folly {

class FOLLY_EXPORT FutureException : public std::logic_error {
 public:
  using std::logic_error::logic_error;
};

class FOLLY_EXPORT FutureInvalid : public FutureException {
 public:
  FutureInvalid() : FutureException("Future invalid") {}
};

/// At most one continuation may be attached to any given Future.
///
/// If a continuation is attached to a future to which another continuation has
/// already been attached, then an instance of FutureAlreadyContinued will be
/// thrown instead.
class FOLLY_EXPORT FutureAlreadyContinued : public FutureException {
 public:
  FutureAlreadyContinued() : FutureException("Future already continued") {}
};

class FOLLY_EXPORT FutureNotReady : public FutureException {
 public:
  FutureNotReady() : FutureException("Future not ready") {}
};

class FOLLY_EXPORT FutureCancellation : public FutureException {
 public:
  FutureCancellation() : FutureException("Future was cancelled") {}
};

class FOLLY_EXPORT FutureTimeout : public FutureException {
 public:
  FutureTimeout() : FutureException("Timed out") {}
};

class FOLLY_EXPORT FuturePredicateDoesNotObtain : public FutureException {
 public:
  FuturePredicateDoesNotObtain()
      : FutureException("Predicate does not obtain") {}
};

class FOLLY_EXPORT FutureNoTimekeeper : public FutureException {
 public:
  FutureNoTimekeeper() : FutureException("No timekeeper available") {}
};

class FOLLY_EXPORT FutureNoExecutor : public FutureException {
 public:
  FutureNoExecutor() : FutureException("No executor provided to via") {}
};

template <class T>
class Future;

template <class T>
class SemiFuture;

template <class T>
class FutureSplitter;

#if FOLLY_FUTURE_USING_FIBER

namespace fibers {
class Baton;
}

#endif

namespace futures {
namespace detail {
template <class T>
class FutureBase {
 protected:
  using Core = futures::detail::Core<T>;
  using CoreCallback = typename Core::Callback;

 public:
  typedef T value_type;

  /// Construct from a value (perfect forwarding)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <
      class T2 = T,
      typename = typename std::enable_if<
          !isFuture<typename std::decay<T2>::type>::value &&
          !isSemiFuture<typename std::decay<T2>::type>::value &&
          std::is_constructible<Try<T>, T2>::value>::type>
  /* implicit */ FutureBase(T2&& val);

  /// Construct a (logical) FutureBase-of-void.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <class T2 = T>
  /* implicit */ FutureBase(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type*);

  template <
      class... Args,
      typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
          type = 0>
  explicit FutureBase(in_place_t, Args&&... args)
      : core_(Core::make(in_place, std::forward<Args>(args)...)) {}

  FutureBase(FutureBase<T> const&) = delete;
  FutureBase(SemiFuture<T>&&) noexcept;
  FutureBase(Future<T>&&) noexcept;

  // not copyable
  FutureBase(Future<T> const&) = delete;
  FutureBase(SemiFuture<T> const&) = delete;

  ~FutureBase();

  /// true if this has a shared state;
  /// false if this has been either moved-out or created without a shared state.
  bool valid() const noexcept {
    return core_ != nullptr;
  }

  /// Returns a reference to the result value if it is ready, with a reference
  /// category and const-qualification like those of the future.
  ///
  /// Does not `wait()`; see `get()` for that.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  ///
  /// Postconditions:
  ///
  /// - If an exception has been captured (i.e., if `hasException() == true`),
  ///   throws that exception.
  /// - This call does not mutate the future's value.
  /// - However calling code may mutate that value (including moving it out by
  ///   move-constructing or move-assigning another value from it), for
  ///   example, via the `&` or the `&&` overloads or via casts.
  T& value() &;
  T const& value() const&;
  T&& value() &&;
  T const&& value() const&&;

  /// Returns a reference to the result's Try if it is ready, with a reference
  /// category and const-qualification like those of the future.
  ///
  /// Does not `wait()`; see `get()` for that.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  ///
  /// Postconditions:
  ///
  /// - This call does not mutate the future's result.
  /// - However calling code may mutate that result (including moving it out by
  ///   move-constructing or move-assigning another result from it), for
  ///   example, via the `&` or the `&&` overloads or via casts.
  Try<T>& result() &;
  Try<T> const& result() const&;
  Try<T>&& result() &&;
  Try<T> const&& result() const&&;

  /// True when the result (or exception) is ready; see value(), result(), etc.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  bool isReady() const;

  /// True if the result is a value (not an exception) on a future for which
  ///   isReady returns true.
  ///
  /// Equivalent to result().hasValue()
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  bool hasValue() const;

  /// True if the result is an exception (not a value) on a future for which
  ///   isReady returns true.
  ///
  /// Equivalent to result().hasException()
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  bool hasException() const;

  /// Returns either an Optional holding the result or an empty Optional
  ///   depending on whether or not (respectively) the promise has been
  ///   fulfilled (i.e., `isReady() == true`).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (note however that this moves-out the result when
  ///   it returns a populated `Try<T>`, which effects any subsequent use of
  ///   that result, e.g., `poll()`, `result()`, `value()`, `get()`, etc.)
  Optional<Try<T>> poll();

  /// This is not the method you're looking for.
  ///
  /// This needs to be public because it's used by make* and when*, and it's
  /// not worth listing all those and their fancy template signatures as
  /// friends. But it's not for public consumption.
  void setCallback_(
      CoreCallback&& func,
      InlineContinuation = InlineContinuation::forbid);

  /// Provides a threadsafe back-channel so the consumer's thread can send an
  ///   interrupt-object to the producer's thread.
  ///
  /// If the promise-holder registers an interrupt-handler and consumer thread
  ///   raises an interrupt early enough (details below), the promise-holder
  ///   will typically halt its work, fulfilling the future with an exception
  ///   or some special non-exception value.
  ///
  /// However this interrupt request is voluntary, asynchronous, & advisory:
  ///
  /// - Voluntary: the producer will see the interrupt only if the producer uses
  ///   a `Promise` object and registers an interrupt-handler;
  ///   see `Promise::setInterruptHandler()`.
  /// - Asynchronous: the producer will see the interrupt only if `raise()` is
  ///   called before (or possibly shortly after) the producer is done producing
  ///   its result, which is asynchronous with respect to the call to `raise()`.
  /// - Advisory: the producer's interrupt-handler can do whatever it wants,
  ///   including ignore the interrupt or perform some action other than halting
  ///   its producer-work.
  ///
  /// Guidelines:
  ///
  /// - It is ideal if the promise-holder can both halt its work and fulfill the
  ///   promise early, typically with the same exception that was delivered to
  ///   the promise-holder in the form of an interrupt.
  /// - If the promise-holder does not do this, and if it holds the promise
  ///   alive for a long time, then the whole continuation chain will not be
  ///   invoked and the whole future chain will be kept alive for that long time
  ///   as well.
  /// - It is also ideal if the promise-holder can invalidate the promise.
  /// - The promise-holder must also track whether it has set a result in the
  ///   interrupt handler so that it does not attempt to do so outside the
  ///   interrupt handler, and must track whether it has set a result in its
  ///   normal flow so that it does not attempt to do so in the interrupt
  ///   handler, since setting a result twice is an error. Because the interrupt
  ///   handler can be invoked in some other thread, this tracking may have to
  ///   be done with some form of concurrency control.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - has no visible effect if `raise()` was previously called on `this` or
  ///   any other Future/SemiFuture that uses the same shared state as `this`.
  /// - has no visible effect if the producer never (either in the past or in
  ///   the future) registers an interrupt-handler.
  /// - has no visible effect if the producer fulfills its promise (sets the
  ///   result) before (or possibly also shortly after) receiving the interrupt.
  /// - otherwise the promise-holder's interrupt-handler is called, passing the
  ///   exception (within an `exception_wrapper`).
  ///
  /// The specific thread used to invoke the producer's interrupt-handler (if
  ///   it is called at all) depends on timing:
  ///
  /// - if the interrupt-handler is registered prior to `raise()` (or possibly
  ///   concurrently within the call to `raise()`), the interrupt-handler will
  ///   be executed using this current thread within the call to `raise()`.
  /// - if the interrupt-handler is registered after `raise()` (and possibly
  ///   concurrently within the call to `raise()`), the interrupt-handler will
  ///   be executed using the producer's thread within the call to
  ///   `Promise::setInterruptHandler()`.
  ///
  /// Synchronizes between `raise()` (in the consumer's thread)
  ///   and `Promise::setInterruptHandler()` (in the producer's thread).
  void raise(exception_wrapper interrupt);

  /// Raises the specified exception-interrupt.
  /// See `raise(exception_wrapper)` for details.
  template <class E>
  void raise(E&& exception) {
    raise(make_exception_wrapper<typename std::remove_reference<E>::type>(
        std::forward<E>(exception)));
  }

  /// Raises a FutureCancellation interrupt.
  /// See `raise(exception_wrapper)` for details.
  void cancel() {
    raise(FutureCancellation());
  }

 protected:
  friend class Promise<T>;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class Future;

  // Throws FutureInvalid if there is no shared state object; else returns it
  // by ref.
  //
  // Implementation methods should usually use this instead of `this->core_`.
  // The latter should be used only when you need the possibly-null pointer.
  Core& getCore() {
    return getCoreImpl(*this);
  }
  Core const& getCore() const {
    return getCoreImpl(*this);
  }

  template <typename Self>
  static decltype(auto) getCoreImpl(Self& self) {
    if (!self.core_) {
      throw_exception<FutureInvalid>();
    }
    return *self.core_;
  }

  Try<T>& getCoreTryChecked() {
    return getCoreTryChecked(*this);
  }
  Try<T> const& getCoreTryChecked() const {
    return getCoreTryChecked(*this);
  }

  template <typename Self>
  static decltype(auto) getCoreTryChecked(Self& self) {
    auto& core = self.getCore();
    if (!core.hasResult()) {
      throw_exception<FutureNotReady>();
    }
    return core.getTry();
  }

  // shared core state object
  // usually you should use `getCore()` instead of directly accessing `core_`.
  Core* core_;

  explicit FutureBase(Core* obj) : core_(obj) {}

  explicit FutureBase(futures::detail::EmptyConstruct) noexcept;

  void detach();

  void throwIfInvalid() const;
  void throwIfContinued() const;

  void assign(FutureBase<T>&& other) noexcept;

  Executor* getExecutor() const {
    return getCore().getExecutor();
  }

  DeferredExecutor* getDeferredExecutor() const {
    return getCore().getDeferredExecutor();
  }

  // Sets the Executor within the Core state object of `this`.
  // Must be called either before attaching a callback or after the callback
  // has already been invoked, but not concurrently with anything which might
  // trigger invocation of the callback.
  void setExecutor(futures::detail::KeepAliveOrDeferred x) {
    getCore().setExecutor(std::move(x));
  }

  // Variant: returns a value
  // e.g. f.thenTry([](Try<T> t){ return t.value(); });
  template <typename F, typename R>
  typename std::enable_if<!R::ReturnsFuture::value, typename R::Return>::type
  thenImplementation(F&& func, R, InlineContinuation);

  // Variant: returns a Future
  // e.g. f.thenTry([](Try<T> t){ return makeFuture<T>(t); });
  template <typename F, typename R>
  typename std::enable_if<R::ReturnsFuture::value, typename R::Return>::type
  thenImplementation(F&& func, R, InlineContinuation);
};
template <class T>
Future<T> convertFuture(SemiFuture<T>&& sf, const Future<T>& f);

class DeferredExecutor;

template <typename T>
DeferredExecutor* getDeferredExecutor(SemiFuture<T>& future);

template <typename T>
futures::detail::DeferredWrapper stealDeferredExecutor(SemiFuture<T>& future);
} // namespace detail

template <class T>
void detachOn(folly::Executor::KeepAlive<> exec, folly::SemiFuture<T>&& fut);

template <class T>
void detachOnGlobalCPUExecutor(folly::SemiFuture<T>&& fut);
} // namespace futures

/// The interface (along with Future) for the consumer-side of a
///   producer/consumer pair.
///
/// Future vs. SemiFuture:
///
/// - The consumer-side should generally start with a SemiFuture, not a Future.
/// - Example, when a library creates and returns a future, it should usually
///   return a `SemiFuture`, not a Future.
/// - Reason: so the thread policy for continuations (`.thenValue`, etc.) can be
///   specified by the library's caller (using `.via()`).
/// - A SemiFuture is converted to a Future using `.via()`.
/// - Use `makePromiseContract()` when creating both a Promise and an associated
///   SemiFuture/Future.
///
/// When practical, prefer SemiFuture/Future's nonblocking style/pattern:
///
/// - the nonblocking style uses continuations, e.g., `.thenValue`, etc.; the
///   continuations are deferred until the result is available.
/// - the blocking style blocks until complete, e.g., `.wait()`, `.get()`, etc.
/// - the two styles cannot be mixed within the same future; use one or the
///   other.
///
/// SemiFuture/Future also provide a back-channel so an interrupt can
///   be sent from consumer to producer; see SemiFuture/Future's `raise()`
///   and Promise's `setInterruptHandler()`.
///
/// The consumer-side SemiFuture/Future objects should generally be accessed
///   via a single thread. That thread is referred to as the 'consumer thread.'
template <class T>
class SemiFuture : private futures::detail::FutureBase<T> {
 private:
  using Base = futures::detail::FutureBase<T>;
  using DeferredExecutor = futures::detail::DeferredExecutor;
  using TimePoint = std::chrono::system_clock::time_point;

 public:
  ~SemiFuture();

  /// Creates/returns an invalid SemiFuture, that is, one with no shared state.
  ///
  /// Postcondition:
  ///
  /// - `RESULT.valid() == false`
  static SemiFuture<T> makeEmpty();

  /// Type of the value that the producer, when successful, produces.
  using typename Base::value_type;

  /// Construct a SemiFuture from a value (perfect forwarding)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `hasException() == false`
  /// - `value()`, `get()`, `result()` will return the forwarded `T`
  template <
      class T2 = T,
      typename = typename std::enable_if<
          !isFuture<typename std::decay<T2>::type>::value &&
          !isSemiFuture<typename std::decay<T2>::type>::value &&
          std::is_constructible<Try<T>, T2>::value>::type>
  /* implicit */ SemiFuture(T2&& val) : Base(std::forward<T2>(val)) {}

  /// Construct a (logical) SemiFuture-of-void.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <class T2 = T>
  /* implicit */ SemiFuture(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type* p = nullptr)
      : Base(p) {}

  /// Construct a SemiFuture from a `T` constructed from `args`
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `hasException() == false`
  /// - `value()`, `get()`, `result()` will return the newly constructed `T`
  template <
      class... Args,
      typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
          type = 0>
  explicit SemiFuture(in_place_t, Args&&... args)
      : Base(in_place, std::forward<Args>(args)...) {}

  SemiFuture(SemiFuture<T> const&) = delete;
  // movable
  SemiFuture(SemiFuture<T>&&) noexcept;
  // safe move-constructabilty from Future
  /* implicit */ SemiFuture(Future<T>&&) noexcept;

  using Base::cancel;
  using Base::hasException;
  using Base::hasValue;
  using Base::isReady;
  using Base::poll;
  using Base::raise;
  using Base::result;
  using Base::setCallback_;
  using Base::valid;
  using Base::value;

  SemiFuture& operator=(SemiFuture const&) = delete;
  SemiFuture& operator=(SemiFuture&&) noexcept;
  SemiFuture& operator=(Future<T>&&) noexcept;

  /// Blocks until the promise is fulfilled, either by value (which is returned)
  ///   or exception (which is thrown).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - must not have a continuation, e.g., via `.thenValue()` or similar
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get() &&;

  /// Blocks until the semifuture is fulfilled, or until `dur` elapses. Returns
  /// the value (moved-out), or throws the exception (which might be a
  /// FutureTimeout exception).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get(HighResDuration dur) &&;

  /// Blocks until the future is fulfilled. Returns the Try of the result
  ///   (moved-out).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  Try<T> getTry() &&;

  /// Blocks until the future is fulfilled, or until `dur` elapses.
  /// Returns the Try of the result (moved-out), or throws FutureTimeout
  /// exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  Try<T> getTry(HighResDuration dur) &&;

  /// Blocks the caller's thread until this Future `isReady()`, i.e., until the
  ///   asynchronous producer has stored a result or exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `&RESULT == this`
  SemiFuture<T>& wait() &;

  /// Blocks the caller's thread until this Future `isReady()`, i.e., until the
  ///   asynchronous producer has stored a result or exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  /// - `isReady() == true`
  SemiFuture<T>&& wait() &&;

  /// Blocks until the future is fulfilled, or `dur` elapses.
  /// Returns true if the future was fulfilled.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  bool wait(HighResDuration dur) &&;

  /// Returns a Future which will call back on the other side of executor.
  Future<T> via(Executor::KeepAlive<> executor) &&;
  Future<T> via(Executor::KeepAlive<> executor, int8_t priority) &&;

  /// Defer work to run on the consumer of the future.
  /// Function must take a Try as a parameter.
  /// This work will be run either on an executor that the caller sets on the
  /// SemiFuture, or inline with the call to .get().
  ///
  /// NB: This is a custom method because boost-blocking executors is a
  /// special-case for work deferral in folly. With more general boost-blocking
  /// support all executors would boost block and we would simply use some form
  /// of driveable executor here.
  ///
  /// All forms of defer will run the continuation inline with the execution of
  /// the  previous callback in the chain if the callback attached to the
  /// previous future that triggers execution of func runs on the same executor
  /// that func would be executed on.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  SemiFuture<typename futures::detail::tryCallableResult<T, F>::value_type>
  defer(F&& func) &&;

  /// Defer work to run on the consumer of the future.
  /// Function must take a const Executor::KeepAlive<>& and a Try as parameters.
  ///
  /// As for defer(F&& func) except as the first parameter to func a KeepAlive
  /// representing the executor running the work will be provided.
  template <typename F>
  SemiFuture<
      typename futures::detail::tryExecutorCallableResult<T, F>::value_type>
  deferExTry(F&& func) &&;

  /// Defer work to run on the consumer of the future.
  /// Function must take a Try as a parameter.
  ///
  /// As for defer(F&& func) but supporting function references.
  template <typename R, typename... Args>
  auto defer(R (&func)(Args...)) && {
    return std::move(*this).defer(&func);
  }

  /// Defer for functions taking a T rather than a Try<T>.
  ///
  /// All forms of defer will run the continuation inline with the execution of
  /// the  previous callback in the chain if the callback attached to the
  /// previous future that triggers execution of func runs on the same executor
  /// that func would be executed on.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  SemiFuture<typename futures::detail::valueCallableResult<T, F>::value_type>
  deferValue(F&& func) &&;

  /// Defer for functions taking a T rather than a Try<T>.
  /// Function must take a const Executor::KeepAlive<>& and a T as parameters.
  ///
  /// As for deferValue(F&& func) except as the first parameter to func a
  /// KeepAlive representing the executor running the work will be provided.
  template <typename F>
  SemiFuture<
      typename futures::detail::valueExecutorCallableResult<T, F>::value_type>
  deferExValue(F&& func) &&;

  /// Defer work to run on the consumer of the future.
  /// Function must take a T as a parameter.
  ///
  /// As for deferValue(F&& func) but supporting function references.
  template <typename R, typename... Args>
  auto deferValue(R (&func)(Args...)) && {
    return std::move(*this).deferValue(&func);
  }

  /// Set an error continuation for this SemiFuture where the continuation can
  /// be called with a known exception type and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  /// ```
  /// makeSemiFuture()
  ///   .defer([] {
  ///     throw std::runtime_error("oh no!");
  ///     return 42;
  ///   })
  ///   .deferError(folly::tag_t<std::runtime_error>{}, [] (auto const& e) {
  ///     LOG(INFO) << "std::runtime_error: " << e.what();
  ///     return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///   });
  /// ```
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class ExceptionType, class F>
  SemiFuture<T> deferError(tag_t<ExceptionType>, F&& func) &&;

  /// As for deferError(tag_t<ExceptionType>, F&& func) but supporting function
  /// references.
  template <class ExceptionType, class R, class... Args>
  SemiFuture<T> deferError(tag_t<ExceptionType> tag, R (&func)(Args...)) && {
    return std::move(*this).deferError(tag, &func);
  }

  /// As for deferError(tag_t<ExceptionType>, F&& func) but makes the exception
  /// explicit as a template argument rather than using a tag type.
  template <class ExceptionType, class F>
  SemiFuture<T> deferError(F&& func) && {
    return std::move(*this).deferError(
        tag_t<ExceptionType>{}, std::forward<F>(func));
  }

  /// Set an error continuation for this SemiFuture where the continuation can
  /// be called with `exception_wrapper&&` and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  ///   makeSemiFuture()
  ///     .defer([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .deferError([] (exception_wrapper&& e) {
  ///       LOG(INFO) << e.what();
  ///       return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class F>
  SemiFuture<T> deferError(F&& func) &&;

  /// As for deferError(tag_t<ExceptionType>, F&& func) but supporting function
  /// references.
  template <class R, class... Args>
  SemiFuture<T> deferError(R (&func)(Args...)) && {
    return std::move(*this).deferError(&func);
  }

  /// Convenience method for ignoring the value and creating a Future<Unit>.
  /// Exceptions still propagate.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  SemiFuture<Unit> unit() &&;

  /// If this SemiFuture completes within duration dur from now, propagate its
  /// value. Otherwise satisfy the returned SemiFuture with a FutureTimeout
  /// exception.
  ///
  /// The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  SemiFuture<T> within(HighResDuration dur, Timekeeper* tk = nullptr) && {
    return std::move(*this).within(dur, FutureTimeout(), tk);
  }

  /// If this SemiFuture completes within duration dur from now, propagate its
  /// value. Otherwise satisfy the returned SemiFuture with exception e.
  ///
  /// The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class E>
  SemiFuture<T> within(HighResDuration dur, E e, Timekeeper* tk = nullptr) &&;

  /// Delay the completion of this SemiFuture for at least this duration from
  /// now. The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  SemiFuture<T> delayed(HighResDuration dur, Timekeeper* tk = nullptr) &&;

  /// Returns a future that completes inline, as if the future had no executor.
  /// Intended for porting legacy code without behavioral change, and for rare
  /// cases where this is really the intended behavior.
  /// Future is unsafe in the sense that the executor it completes on is
  /// non-deterministic in the standard case.
  /// For new code, or to update code that temporarily uses this, please
  /// use via and pass a meaningful executor.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  Future<T> toUnsafeFuture() &&;

#if FOLLY_HAS_COROUTINES

  // Customise the co_viaIfAsync() operator so that SemiFuture<T> can be
  // directly awaited within a folly::coro::Task coroutine.
  friend Future<T> co_viaIfAsync(
      folly::Executor::KeepAlive<> executor,
      SemiFuture<T>&& future) noexcept {
    return std::move(future).via(std::move(executor));
  }

#endif

 private:
  friend class Promise<T>;
  template <class>
  friend class futures::detail::FutureBase;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class Future;
  friend futures::detail::DeferredWrapper
  futures::detail::stealDeferredExecutor<T>(SemiFuture<T>&);
  friend DeferredExecutor* futures::detail::getDeferredExecutor<T>(
      SemiFuture<T>&);

  using Base::setExecutor;
  using Base::throwIfInvalid;
  using typename Base::Core;

  template <class T2>
  friend SemiFuture<T2> makeSemiFuture(Try<T2>);

  explicit SemiFuture(Core* obj) : Base(obj) {}

  explicit SemiFuture(futures::detail::EmptyConstruct) noexcept
      : Base(futures::detail::EmptyConstruct{}) {}

  // Throws FutureInvalid if !this->core_
  futures::detail::DeferredWrapper stealDeferredExecutor();

  /// Blocks until the future is fulfilled, or `dur` elapses.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `&RESULT == this`
  /// - `isReady()` will be indeterminate - may or may not be true
  SemiFuture<T>& wait(HighResDuration dur) &;

  static void releaseDeferredExecutor(Core* core);
};

template <class T>
std::pair<Promise<T>, SemiFuture<T>> makePromiseContract() {
  auto p = Promise<T>();
  auto f = p.getSemiFuture();
  return std::make_pair(std::move(p), std::move(f));
}

/// The interface (along with SemiFuture) for the consumer-side of a
///   producer/consumer pair.
///
/// Future vs. SemiFuture:
///
/// - The consumer-side should generally start with a SemiFuture, not a Future.
/// - Example, when a library creates and returns a future, it should usually
///   return a `SemiFuture`, not a Future.
/// - Reason: so the thread policy for continuations (`.thenValue`, etc.) can be
///   specified by the library's caller (using `.via()`).
/// - A SemiFuture is converted to a Future using `.via()`.
/// - Use `makePromiseContract()` when creating both a Promise and an associated
///   SemiFuture/Future.
///
/// When practical, prefer SemiFuture/Future's nonblocking style/pattern:
///
/// - the nonblocking style uses continuations, e.g., `.thenValue`, etc.; the
///   continuations are deferred until the result is available.
/// - the blocking style blocks until complete, e.g., `.wait()`, `.get()`, etc.
/// - the two styles cannot be mixed within the same future; use one or the
///   other.
///
/// SemiFuture/Future also provide a back-channel so an interrupt can
///   be sent from consumer to producer; see SemiFuture/Future's `raise()`
///   and Promise's `setInterruptHandler()`.
///
/// The consumer-side SemiFuture/Future objects should generally be accessed
///   via a single thread. That thread is referred to as the 'consumer thread.'
template <class T>
class Future : private futures::detail::FutureBase<T> {
 private:
  using Base = futures::detail::FutureBase<T>;

 public:
  /// Type of the value that the producer, when successful, produces.
  using typename Base::value_type;

  /// Construct a Future from a value (perfect forwarding)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `value()`, `get()`, `result()` will return the forwarded `T`
  template <
      class T2 = T,
      typename = typename std::enable_if<
          !isFuture<typename std::decay<T2>::type>::value &&
          !isSemiFuture<typename std::decay<T2>::type>::value &&
          std::is_constructible<Try<T>, T2>::value>::type>
  /* implicit */ Future(T2&& val) : Base(std::forward<T2>(val)) {}

  /// Construct a (logical) Future-of-void.
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  template <class T2 = T>
  /* implicit */ Future(
      typename std::enable_if<std::is_same<Unit, T2>::value>::type* p = nullptr)
      : Base(p) {}

  /// Construct a Future from a `T` constructed from `args`
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `isReady() == true`
  /// - `hasValue() == true`
  /// - `hasException() == false`
  /// - `value()`, `get()`, `result()` will return the newly constructed `T`
  template <
      class... Args,
      typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
          type = 0>
  explicit Future(in_place_t, Args&&... args)
      : Base(in_place, std::forward<Args>(args)...) {}

  Future(Future<T> const&) = delete;
  // movable
  Future(Future<T>&&) noexcept;

  // converting move
  template <
      class T2,
      typename std::enable_if<
          !std::is_same<T, typename std::decay<T2>::type>::value &&
              std::is_constructible<T, T2&&>::value &&
              std::is_convertible<T2&&, T>::value,
          int>::type = 0>
  /* implicit */ Future(Future<T2>&& other)
      : Future(std::move(other).thenValue(
            [](T2&& v) { return T(std::move(v)); })) {}

  template <
      class T2,
      typename std::enable_if<
          !std::is_same<T, typename std::decay<T2>::type>::value &&
              std::is_constructible<T, T2&&>::value &&
              !std::is_convertible<T2&&, T>::value,
          int>::type = 0>
  explicit Future(Future<T2>&& other)
      : Future(std::move(other).thenValue(
            [](T2&& v) { return T(std::move(v)); })) {}

  template <
      class T2,
      typename std::enable_if<
          !std::is_same<T, typename std::decay<T2>::type>::value &&
              std::is_constructible<T, T2&&>::value,
          int>::type = 0>
  Future& operator=(Future<T2>&& other) {
    return operator=(
        std::move(other).thenValue([](T2&& v) { return T(std::move(v)); }));
  }

  using Base::cancel;
  using Base::hasException;
  using Base::hasValue;
  using Base::isReady;
  using Base::poll;
  using Base::raise;
  using Base::result;
  using Base::setCallback_;
  using Base::valid;
  using Base::value;

  /// Creates/returns an invalid Future, that is, one with no shared state.
  ///
  /// Postcondition:
  ///
  /// - `RESULT.valid() == false`
  static Future<T> makeEmpty();

  // not copyable
  Future& operator=(Future const&) = delete;

  // movable
  Future& operator=(Future&&) noexcept;

  /// Call e->drive() repeatedly until the future is fulfilled.
  ///
  /// Examples of DrivableExecutor include EventBase and ManualExecutor.
  ///
  /// Returns the fulfilled value (moved-out) or throws the fulfilled exception.
  T getVia(DrivableExecutor* e);

  /// Call e->drive() repeatedly until the future is fulfilled, or `dur`
  /// elapses.
  ///
  /// Returns the fulfilled value (moved-out), throws the fulfilled exception,
  /// or on timeout throws FutureTimeout.
  T getVia(TimedDrivableExecutor* e, HighResDuration dur);

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns a
  /// reference to the Try of the value.
  Try<T>& getTryVia(DrivableExecutor* e);

  /// getTryVia but will wait only until `dur` elapses. Returns the
  /// Try of the value (moved-out) or may throw a FutureTimeout exception.
  Try<T>& getTryVia(TimedDrivableExecutor* e, HighResDuration dur);

  /// Unwraps the case of a Future<Future<T>> instance, and returns a simple
  /// Future<T> instance.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F = T>
  typename std::
      enable_if<isFuture<F>::value, Future<typename isFuture<T>::Inner>>::type
      unwrap() &&;

  /// Returns a Future which will call back on the other side of executor.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  Future<T> via(Executor::KeepAlive<> executor) &&;
  Future<T> via(Executor::KeepAlive<> executor, int8_t priority) &&;

  /// Returns a Future which will call back on the other side of executor.
  ///
  /// When practical, use the rvalue-qualified overload instead - it's faster.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `RESULT.valid() == true`
  /// - when `this` gets fulfilled, it automatically fulfills RESULT
  Future<T> via(Executor::KeepAlive<> executor) &;
  Future<T> via(Executor::KeepAlive<> executor, int8_t priority) &;

  /// When this Future has completed, execute func which is a function that
  /// can be called with either `T&&` or `Try<T>&&`.
  ///
  /// Func shall return either another Future or a value.
  ///
  /// thenInline will run the continuation inline with the execution of the
  /// previous callback in the chain if the callback attached to the previous
  /// future that triggers execution of func runs on the same executor that func
  /// would be executed on.
  ///
  /// A Future for the return type of func is returned.
  ///
  /// Versions of these functions with Inline in the name will run the
  /// continuation inline if the executor the previous task completes on matches
  /// the executor the next is to be enqueued on to.
  ///
  ///   Future<string> f2 = f1.thenTry([](Try<T>&&) { return string("foo"); });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <typename F>
  Future<typename futures::detail::tryCallableResult<T, F>::value_type> then(
      F&& func) && {
    return std::move(*this).thenTry(std::forward<F>(func));
  }
  template <typename F>
  Future<typename futures::detail::tryCallableResult<T, F>::value_type>
  thenInline(F&& func) && {
    return std::move(*this).thenTryInline(std::forward<F>(func));
  }

  /// Variant where func is an member function
  ///
  ///   struct Worker { R doWork(Try<T>); }
  ///
  ///   Worker *w;
  ///   Future<R> f2 = f1.thenTry(&Worker::doWork, w);
  ///
  /// This is just sugar for
  ///
  ///   f1.thenTry(std::bind(&Worker::doWork, w));
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <typename R, typename Caller, typename... Args>
  Future<typename isFuture<R>::Inner> then(
      R (Caller::*func)(Args...),
      Caller* instance) &&;

  /// Execute the callback via the given Executor. The executor doesn't stick.
  ///
  /// Contrast
  ///
  ///   f.via(x).then(b).then(c)
  ///
  /// with
  ///
  ///   f.then(x, b).then(c)
  ///
  /// In the former both b and c execute via x. In the latter, only b executes
  /// via x, and c executes via the same executor (if any) that f had.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class Arg>
  auto then(Executor::KeepAlive<> x, Arg&& arg) && = delete;

  /// When this Future has completed, execute func which is a function that
  /// can be called with `Try<T>&&` (often a lambda with parameter type
  /// `auto&&` or `auto`).
  ///
  /// Func shall return either another Future or a value.
  ///
  /// Versions of these functions with Inline in the name will run the
  /// continuation inline with the execution of the previous callback in the
  /// chain if the callback attached to the previous future that triggers
  /// execution of func runs on the same executor that func would be executed
  /// on.
  ///
  /// A Future for the return type of func is returned.
  ///
  ///   Future<string> f2 = std::move(f1).thenTry([](auto&& t) {
  ///     ...
  ///     return string("foo");
  ///   });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  Future<typename futures::detail::tryCallableResult<T, F>::value_type> thenTry(
      F&& func) &&;

  template <typename F>
  Future<typename futures::detail::tryCallableResult<T, F>::value_type>
  thenTryInline(F&& func) &&;

  template <typename F>
  Future<typename futures::detail::tryExecutorCallableResult<T, F>::value_type>
  thenExTry(F&& func) &&;

  template <typename F>
  Future<typename futures::detail::tryExecutorCallableResult<T, F>::value_type>
  thenExTryInline(F&& func) &&;

  template <typename R, typename... Args>
  auto thenTry(R (&func)(Args...)) && {
    return std::move(*this).thenTry(&func);
  }

  template <typename R, typename... Args>
  auto thenTryInline(R (&func)(Args...)) && {
    return std::move(*this).thenTryInline(&func);
  }

  /// When this Future has completed, execute func which is a function that
  /// can be called with `T&&` (often a lambda with parameter type
  /// `auto&&` or `auto`).
  ///
  /// Func shall return either another Future or a value.
  ///
  /// Versions of these functions with Inline in the name will run the
  /// continuation inline with the execution of the previous callback in the
  /// chain if the callback attached to the previous future that triggers
  /// execution of func runs on the same executor that func would be executed
  /// on.
  ///
  /// A Future for the return type of func is returned.
  ///
  ///   Future<string> f2 = f1.thenValue([](auto&& v) {
  ///     ...
  ///     return string("foo");
  ///   });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <typename F>
  Future<typename futures::detail::valueCallableResult<T, F>::value_type>
  thenValue(F&& func) &&;

  template <typename F>
  Future<typename futures::detail::valueCallableResult<T, F>::value_type>
  thenValueInline(F&& func) &&;

  template <typename F>
  Future<
      typename futures::detail::valueExecutorCallableResult<T, F>::value_type>
  thenExValue(F&& func) &&;

  template <typename F>
  Future<
      typename futures::detail::valueExecutorCallableResult<T, F>::value_type>
  thenExValueInline(F&& func) &&;

  template <typename R, typename... Args>
  auto thenValue(R (&func)(Args...)) && {
    return std::move(*this).thenValue(&func);
  }

  template <typename R, typename... Args>
  auto thenValueInline(R (&func)(Args...)) && {
    return std::move(*this).thenValueInline(&func);
  }

  /// Set an error continuation for this Future where the continuation can
  /// be called with a known exception type and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  ///   makeFuture()
  ///     .thenTry([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .thenError(folly::tag_t<std::runtime_error>{}, [] (auto const& e) {
  ///       LOG(INFO) << "std::runtime_error: " << e.what();
  ///       return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class ExceptionType, class F>
  typename std::enable_if<
      isFutureOrSemiFuture<invoke_result_t<F, ExceptionType>>::value,
      Future<T>>::type
  thenError(tag_t<ExceptionType>, F&& func) &&;

  template <class ExceptionType, class F>
  typename std::enable_if<
      !isFutureOrSemiFuture<invoke_result_t<F, ExceptionType>>::value,
      Future<T>>::type
  thenError(tag_t<ExceptionType>, F&& func) &&;

  template <class ExceptionType, class R, class... Args>
  Future<T> thenError(tag_t<ExceptionType> tag, R (&func)(Args...)) && {
    return std::move(*this).thenError(tag, &func);
  }

  template <class ExceptionType, class F>
  Future<T> thenError(F&& func) && {
    return std::move(*this).thenError(
        tag_t<ExceptionType>{}, std::forward<F>(func));
  }

  /// Set an error continuation for this Future where the continuation can
  /// be called with `exception_wrapper&&` and returns a `T`, `Future<T>`, or
  /// `SemiFuture<T>`.
  ///
  /// Example:
  ///
  ///   makeFuture()
  ///     .thenTry([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .thenError([] (exception_wrapper&& e) {
  ///       LOG(INFO) << e.what();
  ///       return -1; // or makeFuture<int>(-1) or makeSemiFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  template <class F>
  typename std::enable_if<
      isFutureOrSemiFuture<invoke_result_t<F, exception_wrapper>>::value,
      Future<T>>::type
  thenError(F&& func) &&;

  template <class F>
  typename std::enable_if<
      !isFutureOrSemiFuture<invoke_result_t<F, exception_wrapper>>::value,
      Future<T>>::type
  thenError(F&& func) &&;

  template <class R, class... Args>
  Future<T> thenError(R (&func)(Args...)) && {
    return std::move(*this).thenError(&func);
  }

  /// Convenience method for ignoring the value and creating a Future<Unit>.
  /// Exceptions still propagate.
  /// This function is identical to .unit().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  Future<Unit> then() &&;

  /// Convenience method for ignoring the value and creating a Future<Unit>.
  /// Exceptions still propagate.
  /// This function is identical to parameterless .then().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  Future<Unit> unit() && {
    return std::move(*this).then();
  }

  /// Set an error continuation for this Future. The continuation should take an
  /// argument of the type that you want to catch, and should return a value of
  /// the same type as this Future, or a Future of that type (see overload
  /// below).
  ///
  /// Example:
  ///
  ///   makeFuture()
  ///     .thenValue([] {
  ///       throw std::runtime_error("oh no!");
  ///       return 42;
  ///     })
  ///     .thenError<std::runtime_error>([] (std::runtime_error& e) {
  ///       LOG(INFO) << "std::runtime_error: " << e.what();
  ///       return -1; // or makeFuture<int>(-1)
  ///     });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  [[deprecated(
      "onError loses the attached executor and is weakly typed. Please move to thenError instead.")]]
  typename std::enable_if<
      !is_invocable_v<F, exception_wrapper> &&
          !futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) && = delete;

  /// Overload of onError where the error continuation returns a Future<T>
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  [[deprecated(
      "onError loses the attached executor and is weakly typed. Please move to thenError instead.")]]
  typename std::enable_if<
      !is_invocable_v<F, exception_wrapper> &&
          futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) && = delete;

  /// Overload of onError that takes exception_wrapper and returns Future<T>
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  [[deprecated(
      "onError loses the attached executor and is weakly typed. Please move to thenError instead.")]]
  typename std::enable_if<
      is_invocable_v<F, exception_wrapper> &&
          futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) && = delete;

  /// Overload of onError that takes exception_wrapper and returns T
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  [[deprecated(
      "onError loses the attached executor and is weakly typed. Please move to thenError instead.")]]
  typename std::enable_if<
      is_invocable_v<F, exception_wrapper> &&
          !futures::detail::Extract<F>::ReturnsFuture::value,
      Future<T>>::type
  onError(F&& func) && = delete;

  template <class R, class... Args>
  Future<T> onError(R (&func)(Args...)) && = delete;

  // clang-format off
  template <class F>
  [[deprecated(
      "onError loses the attached executor and is weakly typed. Please move to thenError instead.")]]
  Future<T> onError(F&& func) & = delete;

  /// func is like std::function<void()> and is executed unconditionally, and
  /// the value/exception is passed through to the resulting Future.
  /// func shouldn't throw, but if it does it will be captured and propagated,
  /// and discard any value/exception that this Future has obtained.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> ensure(F&& func) &&;
  // clang-format on

  /// Like thenError, but for timeouts. example:
  ///
  ///   Future<int> f = makeFuture<int>(42)
  ///     .delayed(long_time)
  ///     .onTimeout(short_time,
  ///       [] { return -1; });
  ///
  /// or perhaps
  ///
  ///   Future<int> f = makeFuture<int>(42)
  ///     .delayed(long_time)
  ///     .onTimeout(short_time,
  ///       [] { return makeFuture<int>(some_exception); });
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> onTimeout(HighResDuration, F&& func, Timekeeper* = nullptr) &&;

  /// If this Future completes within duration dur from now, propagate its
  /// value. Otherwise satisfy the returned SemiFuture with a FutureTimeout
  /// exception.
  ///
  /// The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  Future<T> within(HighResDuration dur, Timekeeper* tk = nullptr) &&;

  /// If this SemiFuture completes within duration dur from now, propagate its
  /// value. Otherwise satisfy the returned SemiFuture with exception e.
  ///
  /// The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class E>
  Future<T>
  within(HighResDuration dur, E exception, Timekeeper* tk = nullptr) &&;

  /// Delay the completion of this Future for at least this duration from
  /// now. The optional Timekeeper is as with futures::sleep().
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  /// - `RESULT.valid() == true`
  Future<T> delayed(HighResDuration, Timekeeper* = nullptr) &&;

  /// Blocks until the future is fulfilled. Returns the value (moved-out), or
  /// throws the exception. The future must not already have a continuation.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get() &&;

  /// Blocks until the future is fulfilled, or until `dur` elapses. Returns the
  /// value (moved-out), or throws the exception (which might be a FutureTimeout
  /// exception).
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == false`
  T get(HighResDuration dur) &&;

  /// A reference to the Try of the value
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  /// - `isReady() == true` (else throws FutureNotReady)
  Try<T>& getTry();

  /// Blocks until this Future is complete.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true`
  /// - `&RESULT == this`
  /// - `isReady() == true`
  Future<T>& wait() &;

  /// Blocks until this Future is complete.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  /// - `isReady() == true`
  Future<T>&& wait() &&;

  /// Blocks until this Future is complete, or `dur` elapses.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (so you may call `wait(...)` repeatedly)
  /// - `&RESULT == this`
  /// - `isReady()` will be indeterminate - may or may not be true
  Future<T>& wait(HighResDuration dur) &;

  /// Blocks until this Future is complete or until `dur` passes.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  /// - `isReady()` will be indeterminate - may or may not be true
  Future<T>&& wait(HighResDuration dur) &&;

  /// Call e->drive() repeatedly until the future is fulfilled. Examples
  /// of DrivableExecutor include EventBase and ManualExecutor. Returns a
  /// reference to this Future so that you can chain calls if desired.
  /// value (moved-out), or throws the exception.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (does not move-out `*this`)
  /// - `&RESULT == this`
  Future<T>& waitVia(DrivableExecutor* e) &;

  /// Overload of waitVia() for rvalue Futures
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  Future<T>&& waitVia(DrivableExecutor* e) &&;

  /// As waitVia but may return early after dur passes.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (does not move-out `*this`)
  /// - `&RESULT == this`
  Future<T>& waitVia(TimedDrivableExecutor* e, HighResDuration dur) &;

  /// Overload of waitVia() for rvalue Futures
  /// As waitVia but may return early after dur passes.
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - `valid() == true` (but the calling code can trivially move-out `*this`
  ///   by assigning or constructing the result into a distinct object).
  /// - `&RESULT == this`
  Future<T>&& waitVia(TimedDrivableExecutor* e, HighResDuration dur) &&;

  /// If the value in this Future is equal to the given Future, when they have
  /// both completed, the value of the resulting Future<bool> will be true. It
  /// will be false otherwise (including when one or both Futures have an
  /// exception)
  Future<bool> willEqual(Future<T>&);

  /// predicate behaves like std::function<bool(T const&)>
  /// If the predicate does not obtain with the value, the result
  /// is a folly::FuturePredicateDoesNotObtain exception
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class F>
  Future<T> filter(F&& predicate) &&;

  /// Like reduce, but works on a Future<std::vector<T / Try<T>>>, for example
  /// the result of collect or collectAll
  ///
  /// Preconditions:
  ///
  /// - `valid() == true` (else throws FutureInvalid)
  ///
  /// Postconditions:
  ///
  /// - Calling code should act as if `valid() == false`,
  ///   i.e., as if `*this` was moved into RESULT.
  /// - `RESULT.valid() == true`
  template <class I, class F>
  Future<I> reduce(I&& initial, F&& func) &&;

  /// Moves-out `*this`, creating/returning a corresponding SemiFuture.
  /// Result will behave like `*this` except result won't have an Executor.
  ///
  /// Postconditions:
  ///
  /// - `RESULT.valid() ==` the original value of `this->valid()`
  /// - RESULT will not have an Executor regardless of whether `*this` had one
  SemiFuture<T> semi() && {
    return SemiFuture<T>{std::move(*this)};
  }

#if FOLLY_HAS_COROUTINES

  // Overload needed to customise behaviour of awaiting a Future<T>
  // inside a folly::coro::Task coroutine.
  friend Future<T> co_viaIfAsync(
      folly::Executor::KeepAlive<> executor,
      Future<T>&& future) noexcept {
    return std::move(future).via(std::move(executor));
  }

#endif

 protected:
  friend class Promise<T>;
  template <class>
  friend class futures::detail::FutureBase;
  template <class>
  friend class Future;
  template <class>
  friend class SemiFuture;
  template <class>
  friend class FutureSplitter;

  using Base::setExecutor;
  using Base::throwIfContinued;
  using Base::throwIfInvalid;
  using typename Base::Core;

  explicit Future(Core* obj) : Base(obj) {}

  explicit Future(futures::detail::EmptyConstruct) noexcept
      : Base(futures::detail::EmptyConstruct{}) {}

  template <class T2>
  friend Future<T2> makeFuture(Try<T2>);

  template <class FT>
  friend Future<FT> futures::detail::convertFuture(
      SemiFuture<FT>&& sf,
      const Future<FT>& f);

  using Base::detach;
  template <class T2>
  friend void futures::detachOn(
      folly::Executor::KeepAlive<> exec,
      folly::SemiFuture<T2>&& fut);
};

/// A Timekeeper handles the details of keeping time and fulfilling delay
/// promises. The returned Future<Unit> will either complete after the
/// elapsed time, or in the event of some kind of exceptional error may hold
/// an exception. These Futures respond to cancellation. If you use a lot of
/// Delays and many of them ultimately are unneeded (as would be the case for
/// Delays that are used to trigger timeouts of async operations), then you
/// can and should cancel them to reclaim resources.
///
/// Users will typically get one of these via Future::sleep(HighResDuration dur)
/// or use them implicitly behind the scenes by passing a timeout to some Future
/// operation.
///
/// Although we don't formally alias Delay = Future<Unit>,
/// that's an appropriate term for it. People will probably also call these
/// Timeouts, and that's ok I guess, but that term is so overloaded I thought
/// it made sense to introduce a cleaner term.
///
/// Remember that HighResDuration is a std::chrono duration (millisecond
/// resolution at the time of writing). When writing code that uses specific
/// durations, prefer using the explicit std::chrono type, e.g.
/// std::chrono::milliseconds over HighResDuration. This makes the code more
/// legible and means you won't be unpleasantly surprised if we redefine
/// HighResDuration to microseconds, or something.
///
///   timekeeper.after(std::chrono::duration_cast<HighResDuration>(someNanoseconds))
class Timekeeper {
 public:
  virtual ~Timekeeper() = default;

  /// Returns a future that will complete after the given duration with the
  /// elapsed time. Exceptional errors can happen but they must be
  /// exceptional. Use the steady (monotonic) clock.
  ///
  /// The consumer thread may cancel this Future to reclaim resources.
  virtual SemiFuture<Unit> after(HighResDuration dur) = 0;

  /// Unsafe version of after that returns an inline Future.
  /// Any work added to this future will run inline on the Timekeeper's thread.
  /// This can potentially cause problems with timing.
  ///
  /// Please migrate to use after + a call to via with a valid, non-inline
  /// executor.
  Future<Unit> afterUnsafe(HighResDuration dur) {
    return after(dur).toUnsafeFuture();
  }

  /// Returns a future that will complete at the requested time.
  ///
  /// You may cancel this SemiFuture to reclaim resources.
  ///
  /// NB This is sugar for `after(when - now)`, so while you are welcome to
  /// use a std::chrono::system_clock::time_point it will not track changes to
  /// the system clock but rather execute that many milliseconds in the future
  /// according to the steady clock.
  template <class Clock>
  SemiFuture<Unit> at(std::chrono::time_point<Clock> when);

  /// Unsafe version of at that returns an inline Future.
  /// Any work added to this future will run inline on the Timekeeper's thread.
  /// This can potentially cause problems with timing.
  ///
  /// Please migrate to use at + a call to via with a valid, non-inline
  /// executor.
  template <class Clock>
  Future<Unit> atUnsafe(std::chrono::time_point<Clock> when) {
    return at(when).toUnsafeFuture();
  }
};

template <class T>
std::pair<Promise<T>, Future<T>> makePromiseContract(Executor::KeepAlive<> e) {
  auto p = Promise<T>();
  auto f = p.getSemiFuture().via(std::move(e));
  return std::make_pair(std::move(p), std::move(f));
}

template <class F>
auto makeAsyncTask(folly::Executor::KeepAlive<> ka, F&& func) {
  return
      [func = std::forward<F>(func), ka = std::move(ka)](auto&& param) mutable {
        return via(
            ka,
            [func = std::move(func),
             param = std::forward<decltype(param)>(param)]() mutable {
              return func(std::forward<decltype(param)>(param));
            });
      };
}

/// This namespace is for utility functions that would usually be static
/// members of Future, except they don't make sense there because they don't
/// depend on the template type (rather, on the type of their arguments in
/// some cases). This is the least-bad naming scheme we could think of. Some
/// of the functions herein have really-likely-to-collide names, like "map"
/// and "sleep".
namespace futures {
/// Returns a Future that will complete after the specified duration. The
/// HighResDuration typedef of a `std::chrono` duration type indicates the
/// resolution you can expect to be meaningful (milliseconds at the time of
/// writing). Normally you wouldn't need to specify a Timekeeper, we will
/// use the global futures timekeeper (we run a thread whose job it is to
/// keep time for futures timeouts) but we provide the option for power
/// users.
///
/// The Timekeeper thread will be lazily created the first time it is
/// needed. If your program never uses any timeouts or other time-based
/// Futures you will pay no Timekeeper thread overhead.
SemiFuture<Unit> sleep(HighResDuration, Timekeeper* = nullptr);
[[deprecated(
    "futures::sleep now returns a SemiFuture<Unit>. "
    "sleepUnsafe is deprecated. "
    "Please call futures::sleep and apply an executor with .via")]] Future<Unit>
sleepUnsafe(HighResDuration, Timekeeper* = nullptr);

/**
 * Set func as the callback for each input Future and return a vector of
 * Futures containing the results in the input order.
 */
template <
    class It,
    class F,
    class ItT = typename std::iterator_traits<It>::value_type,
    class Tag = std::enable_if_t<is_invocable_v<F, typename ItT::value_type&&>>,
    class Result = typename decltype(
        std::declval<ItT>().thenValue(std::declval<F>()))::value_type>
std::vector<Future<Result>> mapValue(It first, It last, F func);

/**
 * Set func as the callback for each input Future and return a vector of
 * Futures containing the results in the input order.
 */
template <
    class It,
    class F,
    class ItT = typename std::iterator_traits<It>::value_type,
    class Tag =
        std::enable_if_t<!is_invocable_v<F, typename ItT::value_type&&>>,
    class Result = typename decltype(
        std::declval<ItT>().thenTry(std::declval<F>()))::value_type>
std::vector<Future<Result>> mapTry(It first, It last, F func, int = 0);

/**
 * Set func as the callback for each input Future and return a vector of
 * Futures containing the results in the input order and completing on
 * exec.
 */
template <
    class It,
    class F,
    class ItT = typename std::iterator_traits<It>::value_type,
    class Tag = std::enable_if_t<is_invocable_v<F, typename ItT::value_type&&>>,
    class Result =
        typename decltype(std::move(std::declval<ItT>())
                              .via(std::declval<Executor*>())
                              .thenValue(std::declval<F>()))::value_type>
std::vector<Future<Result>> mapValue(Executor& exec, It first, It last, F func);

/**
 * Set func as the callback for each input Future and return a vector of
 * Futures containing the results in the input order and completing on
 * exec.
 */
template <
    class It,
    class F,
    class ItT = typename std::iterator_traits<It>::value_type,
    class Tag =
        std::enable_if_t<!is_invocable_v<F, typename ItT::value_type&&>>,
    class Result =
        typename decltype(std::move(std::declval<ItT>())
                              .via(std::declval<Executor*>())
                              .thenTry(std::declval<F>()))::value_type>
std::vector<Future<Result>>
mapTry(Executor& exec, It first, It last, F func, int = 0);

// Sugar for the most common case
template <class Collection, class F>
auto mapValue(Collection&& c, F&& func)
    -> decltype(mapValue(c.begin(), c.end(), func)) {
  return mapValue(c.begin(), c.end(), std::forward<F>(func));
}

template <class Collection, class F>
auto mapTry(Collection&& c, F&& func)
    -> decltype(mapTry(c.begin(), c.end(), func)) {
  return mapTry(c.begin(), c.end(), std::forward<F>(func));
}

// Sugar for the most common case
template <class Collection, class F>
auto mapValue(Executor& exec, Collection&& c, F&& func)
    -> decltype(mapValue(exec, c.begin(), c.end(), func)) {
  return mapValue(exec, c.begin(), c.end(), std::forward<F>(func));
}

template <class Collection, class F>
auto mapTry(Executor& exec, Collection&& c, F&& func)
    -> decltype(mapTry(exec, c.begin(), c.end(), func)) {
  return mapTry(exec, c.begin(), c.end(), std::forward<F>(func));
}

/// Carry out the computation contained in the given future if
/// the predicate holds.
///
/// thunk behaves like std::function<Future<T2>(void)> or
/// std::function<SemiFuture<T2>(void)>
template <class F>
auto when(bool p, F&& thunk)
    -> decltype(std::declval<invoke_result_t<F>>().unit());

#if FOLLY_FUTURE_USING_FIBER

SemiFuture<Unit> wait(std::unique_ptr<fibers::Baton> baton);
SemiFuture<Unit> wait(std::shared_ptr<fibers::Baton> baton);

#endif

/**
 * Returns a lazy SemiFuture constructed by f, which also ensures that ensure is
 * called before completion.
 * f doesn't get called until the SemiFuture is activated (e.g. through a .get()
 * or .via() call). If f gets called, ensure is guaranteed to be called as well.
 */
template <typename F, class Ensure>
auto ensure(F&& f, Ensure&& ensure);

} // namespace futures

/**
  Make a completed SemiFuture by moving in a value. e.g.

    string foo = "foo";
    auto f = makeSemiFuture(std::move(foo));

  or

    auto f = makeSemiFuture<string>("foo");
*/
template <class T>
SemiFuture<typename std::decay<T>::type> makeSemiFuture(T&& t);

/** Make a completed void SemiFuture. */
SemiFuture<Unit> makeSemiFuture();

/**
  Make a SemiFuture by executing a function.

  If the function returns a value of type T, makeSemiFutureWith
  returns a completed SemiFuture<T>, capturing the value returned
  by the function.

  If the function returns a SemiFuture<T> already, makeSemiFutureWith
  returns just that.

  Either way, if the function throws, a failed Future is
  returned that captures the exception.
*/

// makeSemiFutureWith(SemiFuture<T>()) -> SemiFuture<T>
template <class F>
typename std::enable_if<
    isFutureOrSemiFuture<invoke_result_t<F>>::value,
    SemiFuture<typename invoke_result_t<F>::value_type>>::type
makeSemiFutureWith(F&& func);

// makeSemiFutureWith(T()) -> SemiFuture<T>
// makeSemiFutureWith(void()) -> SemiFuture<Unit>
template <class F>
typename std::enable_if<
    !(isFutureOrSemiFuture<invoke_result_t<F>>::value),
    SemiFuture<lift_unit_t<invoke_result_t<F>>>>::type
makeSemiFutureWith(F&& func);

/// Make a failed Future from an exception_ptr.
/// Because the Future's type cannot be inferred you have to specify it, e.g.
///
///   auto f = makeSemiFuture<string>(std::current_exception());
template <class T>
[[deprecated("use makeSemiFuture(exception_wrapper)")]] SemiFuture<T>
makeSemiFuture(std::exception_ptr const& e);

/// Make a failed SemiFuture from an exception_wrapper.
template <class T>
SemiFuture<T> makeSemiFuture(exception_wrapper ew);

/** Make a SemiFuture from an exception type E that can be passed to
  std::make_exception_ptr(). */
template <class T, class E>
typename std::
    enable_if<std::is_base_of<std::exception, E>::value, SemiFuture<T>>::type
    makeSemiFuture(E const& e);

/** Make a Future out of a Try */
template <class T>
SemiFuture<T> makeSemiFuture(Try<T> t);

/**
  Make a completed Future by moving in a value. e.g.

    string foo = "foo";
    auto f = makeFuture(std::move(foo));

  or

    auto f = makeFuture<string>("foo");

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
*/
template <class T>
Future<typename std::decay<T>::type> makeFuture(T&& t);

/**
  Make a completed void Future.

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
 */
Future<Unit> makeFuture();

/**
  Make a Future by executing a function.

  If the function returns a value of type T, makeFutureWith
  returns a completed Future<T>, capturing the value returned
  by the function.

  If the function returns a Future<T> already, makeFutureWith
  returns just that.

  Either way, if the function throws, a failed Future is
  returned that captures the exception.

  Calling makeFutureWith(func) is equivalent to calling
  makeFuture().then(func).

  NOTE: This function is deprecated. Please use makeSemiFutureWith and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
*/

// makeFutureWith(Future<T>()) -> Future<T>
template <class F>
typename std::
    enable_if<isFuture<invoke_result_t<F>>::value, invoke_result_t<F>>::type
    makeFutureWith(F&& func);

// makeFutureWith(T()) -> Future<T>
// makeFutureWith(void()) -> Future<Unit>
template <class F>
typename std::enable_if<
    !(isFuture<invoke_result_t<F>>::value),
    Future<lift_unit_t<invoke_result_t<F>>>>::type
makeFutureWith(F&& func);

/// Make a failed Future from an exception_ptr.
/// Because the Future's type cannot be inferred you have to specify it, e.g.
///
///   auto f = makeFuture<string>(std::current_exception());
template <class T>
[[deprecated("use makeSemiFuture(exception_wrapper)")]] Future<T> makeFuture(
    std::exception_ptr const& e);

/// Make a failed Future from an exception_wrapper.
/// NOTE: This function is deprecated. Please use makeSemiFuture and pass the
///     appropriate executor to .via on the returned SemiFuture to get a
///     valid Future where necessary.
template <class T>
Future<T> makeFuture(exception_wrapper ew);

/** Make a Future from an exception type E that can be passed to
  std::make_exception_ptr().

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
 */
template <class T, class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value, Future<T>>::
    type
    makeFuture(E const& e);

/**
  Make a Future out of a Try

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
 */
template <class T>
Future<T> makeFuture(Try<T> t);

/*
 * Return a new Future that will call back on the given Executor.
 * This is just syntactic sugar for makeFuture().via(executor)
 *
 * @param executor the Executor to call back on
 * @param priority optionally, the priority to add with. Defaults to 0 which
 * represents medium priority.
 *
 * @returns a void Future that will call back on the given executor
 */
inline Future<Unit> via(Executor::KeepAlive<> executor);
inline Future<Unit> via(Executor::KeepAlive<> executor, int8_t priority);

/// Execute a function via the given executor and return a future.
/// This is semantically equivalent to via(executor).then(func), but
/// easier to read and slightly more efficient.
template <class Func>
auto via(Executor::KeepAlive<>, Func&& func) -> Future<
    typename isFutureOrSemiFuture<decltype(std::declval<Func>()())>::Inner>;

/** When all the input Futures complete, the returned Future will complete.
  Errors do not cause early termination; this Future will always succeed
  after all its Futures have finished (whether successfully or with an
  error).

  The Futures are moved in, so your copies are invalid. If you need to
  chain further from these Futures, use the variant with an output iterator.

  This function is thread-safe for Futures running on different threads. But
  if you are doing anything non-trivial after, you will probably want to
  follow with `via(executor)` because it will complete in whichever thread the
  last Future completes in.

  The return type for Future<T> input is a SemiFuture<std::vector<Try<T>>>
  for collectX and collectXSemiFuture.

  collectXUnsafe returns an inline Future that erases the executor from the
  incoming Futures/SemiFutures. collectXUnsafe should be phased out and
  replaced with collectX(...).via(e) where e is a valid non-inline executor.
  */
template <class InputIterator>
SemiFuture<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAllSemiFuture(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collectAllSemiFuture(Collection&& c)
    -> decltype(collectAllSemiFuture(c.begin(), c.end())) {
  return collectAllSemiFuture(c.begin(), c.end());
}

// Unsafe variant, see above comment for details
template <class InputIterator>
Future<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAllUnsafe(InputIterator first, InputIterator last);

// Unsafe variant sugar, see above comment for details
template <class Collection>
auto collectAllUnsafe(Collection&& c)
    -> decltype(collectAllUnsafe(c.begin(), c.end())) {
  return collectAllUnsafe(c.begin(), c.end());
}

template <class InputIterator>
SemiFuture<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAll(InputIterator first, InputIterator last);

template <class Collection>
auto collectAll(Collection&& c) -> decltype(collectAll(c.begin(), c.end())) {
  return collectAll(c.begin(), c.end());
}

/// This version takes a varying number of Futures instead of an iterator.
/// The return type for (Future<T1>, Future<T2>, ...) input
/// is a SemiFuture<std::tuple<Try<T1>, Try<T2>, ...>>.
/// The Futures are moved in, so your copies are invalid.
template <typename... Fs>
SemiFuture<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>>
collectAllSemiFuture(Fs&&... fs);

// Unsafe variant of collectAll, see coment above for details. Returns
// a Future<std::tuple<Try<T1>, Try<T2>, ...>> on the Inline executor.
template <typename... Fs>
Future<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>>
collectAllUnsafe(Fs&&... fs);

template <typename... Fs>
SemiFuture<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>>
collectAll(Fs&&... fs);

/// Like collectAll, but will short circuit on the first exception. Thus, the
/// type of the returned SemiFuture is std::vector<T> instead of
/// std::vector<Try<T>>
template <class InputIterator>
SemiFuture<std::vector<
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collect(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collect(Collection&& c) -> decltype(collect(c.begin(), c.end())) {
  return collect(c.begin(), c.end());
}

// Unsafe variant of collect. Returns a Future<std::vector<T>> that
// completes inline.
template <class InputIterator>
Future<std::vector<
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collectUnsafe(InputIterator first, InputIterator last);

/// Sugar for the most common unsafe case. Returns a Future<std::vector<T>>
// that completes inline.
template <class Collection>
auto collectUnsafe(Collection&& c)
    -> decltype(collectUnsafe(c.begin(), c.end())) {
  return collectUnsafe(c.begin(), c.end());
}

/// Like collectAll, but will short circuit on the first exception. Thus, the
/// type of the returned SemiFuture is std::tuple<T1, T2, ...> instead of
/// std::tuple<Try<T1>, Try<T2>, ...>
template <typename... Fs>
SemiFuture<std::tuple<typename remove_cvref_t<Fs>::value_type...>> collect(
    Fs&&... fs);

/** The result is a pair of the index of the first Future to complete and
  the Try. If multiple Futures complete at the same time (or are already
  complete when passed in), the "winner" is chosen non-deterministically.

  This function is thread-safe for Futures running on different threads.
  */
template <class InputIterator>
SemiFuture<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAny(InputIterator first, InputIterator last);
// Unsafe variant of collectAny, Returns a Future that completes inline.
template <class InputIterator>
Future<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAnyUnsafe(InputIterator first, InputIterator last);
template <class InputIterator>
SemiFuture<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAnySemiFuture(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collectAny(Collection&& c) -> decltype(collectAny(c.begin(), c.end())) {
  return collectAny(c.begin(), c.end());
}
// Unsafe variant of common form of collectAny, Returns a Future that completes
// inline.
template <class Collection>
auto collectAnyUnsafe(Collection&& c)
    -> decltype(collectAnyUnsafe(c.begin(), c.end())) {
  return collectAnyUnsafe(c.begin(), c.end());
}
template <class Collection>
auto collectAnySemiFuture(Collection&& c)
    -> decltype(collectAnySemiFuture(c.begin(), c.end())) {
  return collectAnySemiFuture(c.begin(), c.end());
}

/** Similar to collectAny, collectAnyWithoutException return the first Future to
 * complete without exceptions. If none of the future complete without
 * exceptions, the last exception will be returned as a result.
 */
template <class InputIterator>
SemiFuture<std::pair<
    size_t,
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collectAnyWithoutException(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collectAnyWithoutException(Collection&& c)
    -> decltype(collectAnyWithoutException(c.begin(), c.end())) {
  return collectAnyWithoutException(c.begin(), c.end());
}

/** when n Futures have completed, the Future completes with a vector of
  the index and Try of those n Futures (the indices refer to the original
  order, but the result vector will be in an arbitrary order)

  Not thread safe.
  */
template <class InputIterator>
SemiFuture<std::vector<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>>
collectN(InputIterator first, InputIterator last, size_t n);

/// Sugar for the most common case
template <class Collection>
auto collectN(Collection&& c, size_t n)
    -> decltype(collectN(c.begin(), c.end(), n)) {
  return collectN(c.begin(), c.end(), n);
}

/** window creates up to n Futures using the values
    in the collection, and then another Future for each Future
    that completes

    this is basically a sliding window of Futures of size n

    func must return a Future for each value in input
  */
template <
    class Collection,
    class F,
    class ItT = typename std::iterator_traits<
        typename Collection::iterator>::value_type,
    class Result = typename invoke_result_t<F, ItT&&>::value_type>
std::vector<Future<Result>> window(Collection input, F func, size_t n);

template <
    class Collection,
    class F,
    class ItT = typename std::iterator_traits<
        typename Collection::iterator>::value_type,
    class Result = typename invoke_result_t<F, ItT&&>::value_type>
std::vector<Future<Result>>
window(Executor::KeepAlive<> executor, Collection input, F func, size_t n);

template <typename F, typename T, typename ItT>
using MaybeTryArg = typename std::
    conditional<is_invocable_v<F, T&&, Try<ItT>&&>, Try<ItT>, ItT>::type;

/** repeatedly calls func on every result, e.g.
    reduce(reduce(reduce(T initial, result of first), result of second), ...)

    The type of the final result is a Future of the type of the initial value.

    Func can either return a T, or a Future<T>

    func is called in order of the input, see unorderedReduce if that is not
    a requirement
  */
template <class It, class T, class F>
Future<T> reduce(It first, It last, T&& initial, F&& func);

/// Sugar for the most common case
template <class Collection, class T, class F>
auto reduce(Collection&& c, T&& initial, F&& func) -> decltype(folly::reduce(
    c.begin(),
    c.end(),
    std::forward<T>(initial),
    std::forward<F>(func))) {
  return folly::reduce(
      c.begin(), c.end(), std::forward<T>(initial), std::forward<F>(func));
}

/** like reduce, but calls func on finished futures as they complete
    does NOT keep the order of the input
  */
template <class It, class T, class F>
Future<T> unorderedReduce(It first, It last, T initial, F func);

/// Sugar for the most common case
template <class Collection, class T, class F>
auto unorderedReduce(Collection&& c, T&& initial, F&& func)
    -> decltype(folly::unorderedReduce(
        c.begin(),
        c.end(),
        std::forward<T>(initial),
        std::forward<F>(func))) {
  return folly::unorderedReduce(
      c.begin(), c.end(), std::forward<T>(initial), std::forward<F>(func));
}

/// Carry out the computation contained in the given future if
/// while the predicate continues to hold.
///
/// if thunk behaves like std::function<Future<T2>(void)>
///    returns Future<Unit>
/// if thunk behaves like std::function<SemiFuture<T2>(void)>
///    returns SemiFuture<Unit>
/// predicate behaves like std::function<bool(void)>
template <class P, class F>
typename std::enable_if<isFuture<invoke_result_t<F>>::value, Future<Unit>>::type
whileDo(P&& predicate, F&& thunk);
template <class P, class F>
typename std::
    enable_if<isSemiFuture<invoke_result_t<F>>::value, SemiFuture<Unit>>::type
    whileDo(P&& predicate, F&& thunk);

/// Repeat the given future (i.e., the computation it contains) n times.
///
/// thunk behaves like
///   std::function<Future<T2>(void)>
/// or
///   std::function<SemiFuture<T2>(void)>
template <class F>
auto times(int n, F&& thunk);
} // namespace folly

#if FOLLY_HAS_COROUTINES

namespace folly {
namespace detail {

template <typename T>
class FutureAwaitable {
 public:
  explicit FutureAwaitable(folly::Future<T>&& future) noexcept
      : future_(std::move(future)) {}

  bool await_ready() {
    if (future_.isReady()) {
      result_ = std::move(future_.getTry());
      return true;
    }
    return false;
  }

  T await_resume() {
    return std::move(result_).value();
  }

  Try<T> await_resume_try() {
    return std::move(result_);
  }

  FOLLY_CORO_AWAIT_SUSPEND_NONTRIVIAL_ATTRIBUTES void await_suspend(
      std::experimental::coroutine_handle<> h) {
    // FutureAwaitable may get destroyed as soon as the callback is executed.
    // Make sure the future object doesn't get destroyed until setCallback_
    // returns.
    auto future = std::move(future_);
    future.setCallback_(
        [this, h](Executor::KeepAlive<>&&, Try<T>&& result) mutable {
          result_ = std::move(result);
          h.resume();
        });
  }

 private:
  folly::Future<T> future_;
  folly::Try<T> result_;
};

} // namespace detail

template <typename T>
inline detail::FutureAwaitable<T>
/* implicit */ operator co_await(Future<T>&& future) noexcept {
  return detail::FutureAwaitable<T>(std::move(future));
}

} // namespace folly
#endif

#include <folly/futures/Future-inl.h>
