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

#include <folly/synchronization/DistributedMutex.h>

#include <folly/ConstexprMath.h>
#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/Utility.h>
#include <folly/chrono/Hardware.h>
#include <folly/detail/Futex.h>
#include <folly/functional/Invoke.h>
#include <folly/lang/Align.h>
#include <folly/lang/Bits.h>
#include <folly/portability/Asm.h>
#include <folly/synchronization/AtomicNotification.h>
#include <folly/synchronization/AtomicUtil.h>
#include <folly/synchronization/detail/InlineFunctionRef.h>
#include <folly/synchronization/detail/Sleeper.h>

#include <glog/logging.h>

#include <array>
#include <atomic>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <thread>
#include <utility>

namespace folly {
namespace detail {
namespace distributed_mutex {
// kUnlocked is used to show unlocked state
//
// When locking threads encounter kUnlocked in the underlying storage, they
// can just acquire the lock without any further effort
constexpr auto kUnlocked = std::uintptr_t{0b0};
// kLocked is used to show that the mutex is currently locked, and future
// attempts to lock the mutex should enqueue on the central storage
//
// Locking threads find this on central storage only when there is a
// contention chain that is undergoing wakeups, in every other case, a locker
// will either find kUnlocked or an arbitrary address with the kLocked bit set
constexpr auto kLocked = std::uintptr_t{0b1};
// kTimedWaiter is set when there is at least one timed waiter on the mutex
//
// Timed waiters do not follow the sleeping strategy employed by regular,
// non-timed threads.  They sleep on the central mutex atomic through an
// extended futex() interface that allows sleeping with the same semantics for
// non-standard integer widths
//
// When a regular non-timed thread unlocks or enqueues on the mutex, and sees
// a timed waiter, it takes ownership of all the timed waiters.  The thread
// that has taken ownership of the timed waiter releases the timed waiters
// when it gets a chance at the critical section.  At which point it issues a
// wakeup to single timed waiter, timed waiters always issue wake() calls to
// other timed waiters
constexpr auto kTimedWaiter = std::uintptr_t{0b10};

// kUninitialized means that the thread has just enqueued, and has not yet
// gotten to initializing itself with the address of its successor
//
// this becomes significant for threads that are trying to wake up the
// uninitialized thread, if they see that the thread is not yet initialized,
// they can do nothing but spin, and wait for the thread to get initialized
//
// This also plays a role in the functioning of flat combining as implemented
// in DistributedMutex.  When a thread owning the lock goes through the
// contention chain to either unlock the mutex or combine critical sections
// from the other end.  The presence of kUninitialized means that the
// combining thread is not able to make progress after this point.  So we
// transfer the lock.
constexpr auto kUninitialized = std::uint32_t{0b0};
// kWaiting will be set in the waiter's futex structs while they are spinning
// while waiting for the mutex
constexpr auto kWaiting = std::uint32_t{0b1};
// kWake will be set by threads that are waking up waiters that have enqueued
constexpr auto kWake = std::uint32_t{0b10};
// kSkipped will be set by a waker when they see that a waiter has been
// preempted away by the kernel, in this case the thread that got skipped will
// have to wake up and put itself back on the queue
constexpr auto kSkipped = std::uint32_t{0b11};
// kAboutToWait will be set by a waiter that enqueues itself with the purpose
// of waiting on a futex
constexpr auto kAboutToWait = std::uint32_t{0b100};
// kSleeping will be set by a waiter right before enqueueing on a futex.  When
// a thread wants to wake up a waiter that has enqueued on a futex, it should
// set the futex to contain kWake
//
// a thread that is unlocking and wants to skip over a sleeping thread also
// calls futex_.exchange(kSleeping) on the sleeping thread's futex word.  It
// does this to 1. detect whether the sleeping thread had actually gone to
// sleeping on the futex word so it can skip it, and 2. to synchronize with
// other non atomic writes in the sleeping thread's context (such as the write
// to track the next waiting thread).
//
// We reuse kSleeping instead of say using another constant kEarlyDelivery to
// avoid situations where a thread has to enter kernel mode due to calling
// futexWait() twice because of the presence of a waking thread.  This
// situation can arise when an unlocking thread goes to skip over a sleeping
// thread, sees that the thread has slept and move on, but the sleeping thread
// had not yet entered futex().  This interleaving causes the thread calling
// futex() to return spuriously, as the futex word is not what it should be
constexpr auto kSleeping = std::uint32_t{0b101};
// kCombined is set by the lock holder to let the waiter thread know that its
// combine request was successfully completed by the lock holder.  A
// successful combine means that the thread requesting the combine operation
// does not need to unlock the mutex; in fact, doing so would be an error.
constexpr auto kCombined = std::uint32_t{0b111};
// kCombineUninitialized is like kUninitialized but is set by a thread when it
// enqueues in hopes of getting its critical section combined with the lock
// holder
constexpr auto kCombineUninitialized = std::uint32_t{0b1000};
// kCombineWaiting is set by a thread when it is ready to have its combine
// record fulfilled by the lock holder.  In particular, this signals to the
// lock holder that the thread has set its next_ pointer in the contention
// chain
constexpr auto kCombineWaiting = std::uint32_t{0b1001};
// kExceptionOccurred is set on the waiter futex when the remote task throws
// an exception.  It is the caller's responsibility to retrieve the exception
// and rethrow it in their own context.  Note that when the caller uses a
// noexcept function as their critical section, they can avoid checking for
// this value
//
// This allows us to avoid all cost of exceptions in the memory layout of the
// fast path (no errors) as exceptions are stored as an std::exception_ptr in
// the same union that stores the return value of the critical section.  We
// also avoid all CPU overhead because the combiner uses a try-catch block
// without any additional branching to handle exceptions
constexpr auto kExceptionOccurred = std::uint32_t{0b1010};

// The number of spins that we are allowed to do before we resort to marking a
// thread as having slept
//
// This is just a magic number from benchmarks
constexpr auto kScheduledAwaySpinThreshold = std::chrono::nanoseconds{200};
// The maximum number of spins before a thread starts yielding its processor
// in hopes of getting skipped
constexpr auto kMaxSpins = 4000;
// The maximum number of contention chains we can resolve with flat combining.
// After this number of contention chains, the mutex falls back to regular
// two-phased mutual exclusion to ensure that we don't starve the combiner
// thread
constexpr auto kMaxCombineIterations = 2;

/**
 * Write only data that is available to the thread that is waking up another.
 * Only the waking thread is allowed to write to this, the thread to be woken
 * is allowed to read from this after a wakeup has been issued
 */
template <template <typename> class Atomic>
class WakerMetadata {
 public:
  // This is the thread that initiated wakeups for the contention chain.
  // There can only ever be one thread that initiates the wakeup for a
  // chain in the spin only version of this mutex.  When a thread that just
  // woke up sees this as the next thread to wake up, it knows that it is the
  // terminal node in the contention chain.  This means that it was the one
  // that took off the thread that had acquired the mutex off the centralized
  // state.  Therefore, the current thread is the last in its contention
  // chain.  It will fall back to centralized storage to pick up the next
  // waiter or release the mutex
  //
  // When we move to a full sleeping implementation, this might need to change
  // to a small_vector<> to account for failed wakeups, or we can put threads
  // to sleep on the central futex, which is an easier implementation
  // strategy.  Although, since this is allocated on the stack, we can set a
  // prohitively large threshold to avoid heap allocations, this strategy
  // however, might cause increased cache misses on wakeup signalling
  std::uintptr_t waker_{0};
  // the list of threads that the waker had previously seen to be sleeping on
  // a futex(),
  //
  // this is given to the current thread as a means to pass on
  // information.  When the current thread goes to unlock the mutex and does
  // not see contention, it should go and wake up the head of this list.  If
  // the current thread sees a contention chain on the mutex, it should pass
  // on this list to the next thread that gets woken up
  std::uintptr_t waiters_{0};
  // The futex that this waiter will sleep on
  //
  // how can we reuse futex_ from above for futex management?
  Futex<Atomic> sleeper_{kUninitialized};
};

/**
 * Type of the type-erased callable that is used for combining from the lock
 * holder's end.  This has 48 bytes of inline storage that can be used to
 * minimize cache misses when combining
 */
using CombineFunction = detail::InlineFunctionRef<void(), 48>;

/**
 * Waiter encapsulates the state required for waiting on the mutex, this
 * contains potentially heavy state and is intended to be allocated on the
 * stack as part of a lock() function call
 *
 * To ensure that synchronization does not cause unintended side effects on
 * the rest of the thread stack (eg. metadata in lockImplementation(), or any
 * other data in the user's thread), we aggresively pad this struct and use
 * custom alignment internally to ensure that the relevant data fits within a
 * single cacheline.  The added alignment here also gives us some room to
 * wiggle in the bottom few bits of the mutex, where we store extra metadata
 */
template <template <typename> class Atomic>
class Waiter {
 public:
  Waiter() {}
  Waiter(Waiter&&) = delete;
  Waiter(const Waiter&) = delete;
  Waiter& operator=(Waiter&&) = delete;
  Waiter& operator=(const Waiter&) = delete;

  void initialize(std::uint64_t futex, CombineFunction task) {
    // we only initialize the function if we were actually given a non-null
    // task, otherwise
    if (task) {
      DCHECK_EQ(futex, kCombineUninitialized);
      new (&function_) CombineFunction{task};
    } else {
      DCHECK((futex == kUninitialized) || (futex == kAboutToWait));
      new (&metadata_) WakerMetadata<Atomic>{};
    }

    // this pedantic store is needed to ensure that the waking thread
    // synchronizes with the state in the waiter struct when it loads the
    // value of the futex word
    //
    // on x86, this gets optimized away to just a regular store, it might be
    // needed on platforms where explicit acquire-release barriers are
    // required for synchronization
    //
    // note that we release here at the end of the constructor because
    // construction is complete here, any thread that acquires this release
    // will see a well constructed wait node
    futex_.store(futex, std::memory_order_release);
  }

  std::array<std::uint8_t, hardware_destructive_interference_size> padding1;
  // the atomic that this thread will spin on while waiting for the mutex to
  // be unlocked
  alignas(hardware_destructive_interference_size) Atomic<std::uint64_t> futex_{
      kUninitialized};
  // The successor of this node.  This will be the thread that had its address
  // on the mutex previously
  //
  // We can do without making this atomic since the remote thread synchronizes
  // on the futex variable above.  If this were not atomic, the remote thread
  // would only be allowed to read from it after the waiter has moved into the
  // waiting state to avoid risk of a load racing with a write.  However, it
  // helps to make this atomic because we can use an unconditional load and make
  // full use of the load buffer to coalesce both reads into a single clock
  // cycle after the line arrives in the combiner core.  This is a heavily
  // contended line, so an RFO from the enqueueing thread is highly likely and
  // has the potential to cause an immediate invalidation; blocking the combiner
  // thread from making progress until the line is pulled back to read this
  // value
  //
  // Further, making this atomic prevents the compiler from making an incorrect
  // optimization where it does not load the value as written in the code, but
  // rather dereferences it through a pointer whenever needed (since the value
  // of the pointer to this is readily available on the stack).  Doing this
  // causes multiple invalidation requests from the enqueueing thread, blocking
  // remote progress
  //
  // Note that we use relaxed loads and stores, so this should not have any
  // additional overhead compared to a regular load on most architectures
  std::atomic<std::uintptr_t> next_{0};
  // We use an anonymous union for the combined critical section request and
  // the metadata that will be filled in from the leader's end.  Only one is
  // active at a time - if a leader decides to combine the requested critical
  // section into its execution, it will not touch the metadata field.  If a
  // leader decides to migrate the lock to the waiter, it will not touch the
  // function
  //
  // this allows us to transfer more state when combining a critical section
  // and reduce the cache misses originating from executing an arbitrary
  // lambda
  //
  // note that this is an anonymous union, not an unnamed union, the members
  // leak into the surrounding scope
  union {
    // metadata for the waker
    WakerMetadata<Atomic> metadata_;
    // The critical section that can potentially be combined into the critical
    // section of the locking thread
    //
    // This is kept as a FunctionRef because the original function is preserved
    // until the lock_combine() function returns.  A consequence of using
    // FunctionRef here is that we don't need to do any allocations and can
    // allow users to capture unbounded state into the critical section.  Flat
    // combining means that the user does not have access to the thread
    // executing the critical section, so assumptions about thread local
    // references can be invalidated.  Being able to capture arbitrary state
    // allows the user to do thread local accesses right before the critical
    // section and pass them as state to the callable being referenced here
    CombineFunction function_;
    // The user is allowed to use a combined critical section that returns a
    // value.  This buffer is used to implement the value transfer to the
    // waiting thread.  We reuse the same union because this helps us combine
    // one synchronization operation with a material value transfer.
    //
    // The waker thread needs to synchronize on this cacheline to issue a
    // wakeup to the waiter, meaning that the entire line needs to be pulled
    // into the remote core in exclusive mode.  So we reuse the coherence
    // operation to transfer the return value in addition to the
    // synchronization signal.  In the case that the user's data item is
    // small, the data is transferred all inline as part of the same line,
    // which pretty much arrives into the CPU cache in the same clock cycle or
    // two after a read-for-ownership request.  This gives us a high chance of
    // coalescing the entire transitive store buffer together into one cache
    // coherence operation from the waker's end.  This allows us to make use
    // of the CPU bus bandwidth which would have otherwise gone to waste.
    // Benchmarks prove this theory under a wide range of contention, value
    // sizes, NUMA interactions and processor models
    //
    // The current version of the Intel optimization manual confirms this
    // theory somewhat as well in section 2.3.5.1 (Load and Store Operation
    // Overview)
    //
    //    When an instruction writes data to a memory location [...], the
    //    processor ensures that it has the line containing this memory location
    //    is in its L1d cache [...]. If the cache line is not there, it fetches
    //    from the next levels using a RFO request [...] RFO and storing the
    //    data happens after instruction retirement.  Therefore, the store
    //    latency usually does not affect the store instruction itself
    //
    // This gives the user the ability to input up to 48 bytes into the
    // combined critical section through an InlineFunctionRef and output 48
    // bytes from it basically without any cost.  The type of the entity
    // stored in the buffer has to be matched by the type erased callable that
    // the caller has used.  At this point, the caller is still in the
    // template instantiation leading to the combine request, so it has
    // knowledge of the return type and can apply the appropriate
    // reinterpret_cast and launder operation to safely retrieve the data from
    // this buffer
    std::aligned_storage_t<48, 8> storage_;
  };
  std::array<std::uint8_t, hardware_destructive_interference_size> padding2;
};

/**
 * A template that helps us differentiate between the different ways to return
 * a value from a combined critical section.  A return value of type void
 * cannot be stored anywhere, so we use specializations and pick the right one
 * switched through std::conditional_t
 *
 * This is then used by CoalescedTask and its family of functions to implement
 * efficient return value transfers to the waiting threads
 */
template <typename Func>
class RequestWithReturn {
 public:
  using F = Func;
  using ReturnType = folly::invoke_result_t<const Func&>;
  explicit RequestWithReturn(Func func) : func_{std::move(func)} {}

  /**
   * We need to define the destructor here because C++ requires (with good
   * reason) that a union with non-default destructor be explicitly destroyed
   * from the surrounding class, as neither the runtime nor compiler have the
   * knowledge of what to do with a union at the time of destruction
   *
   * Each request that has a valid return value set will have the value
   * retrieved from the get() method, where the value is destroyed.  So we
   * don't need to destroy it here
   */
  ~RequestWithReturn() {}

  /**
   * This method can be used to return a value from the request.  This returns
   * the underlying value because return type of the function we were
   * instantiated with is not void
   */
  ReturnType get() && {
    // when the return value has been processed, we destroy the value
    // contained in this request.  Using a scope_exit means that we don't have
    // to worry about storing the value somewhere and causing potentially an
    // extra move
    //
    // note that the invariant here is that this function is only called if the
    // requesting thread had it's critical section combined, and the value_
    // member constructed through detach()
    SCOPE_EXIT {
      value_.~ReturnType();
    };
    return std::move(value_);
  }

  // this contains a copy of the function the waiter had requested to be
  // executed as a combined critical section
  Func func_;
  // this stores the return value used in the request, we use a union here to
  // avoid laundering and allow return types that are not default
  // constructible to be propagated through the execution of the critical
  // section
  //
  // note that this is an anonymous union, the member leaks into the
  // surrounding scope as a member variable
  union {
    ReturnType value_;
  };
};

template <typename Func>
class RequestWithoutReturn {
 public:
  using F = Func;
  using ReturnType = void;
  explicit RequestWithoutReturn(Func func) : func_{std::move(func)} {}

  /**
   * In this version of the request class, get() returns nothing as there is
   * no stored value
   */
  void get() && {}

  // this contains a copy of the function the waiter had requested to be
  // executed as a combined critical section
  Func func_;
};

// we need to use std::integral_constant::value here as opposed to
// std::integral_constant::operator T() because MSVC errors out with the
// implicit conversion
template <typename Func>
using Request = std::conditional_t<
    std::is_void<folly::invoke_result_t<const Func&>>::value,
    RequestWithoutReturn<Func>,
    RequestWithReturn<Func>>;

/**
 * A template that helps us to transform a callable returning a value to one
 * that returns void so it can be type erased and passed on to the waker.  If
 * the return value is small enough, it gets coalesced into the wait struct
 * for optimal data transfer.  When it's not small enough to fit in the waiter
 * storage buffer, we place it on it's own cacheline with isolation to prevent
 * false-sharing with the on-stack metadata of the waiter thread
 *
 * This helps a combined critical section feel more normal in the case where
 * the user wants to return a value, for example
 *
 *    auto value = mutex_.lock_combine([&]() {
 *      return data_.value();
 *    });
 *
 * Without this, the user would typically create a dummy object that they
 * would then assign to from within the lambda.  With return value chaining,
 * this pattern feels more natural
 *
 * Note that it is important to copy the entire callble into this class.
 * Storing something like a reference instead is not desirable because it does
 * not allow InlineFunctionRef to use inline storage to represent the user's
 * callable without extra indirections
 *
 * We use std::conditional_t and switch to the right type of task with the
 * CoalescedTask type alias
 */
template <typename Func, typename Waiter>
class TaskWithCoalesce {
 public:
  using ReturnType = folly::invoke_result_t<const Func&>;
  using StorageType = folly::Unit;
  explicit TaskWithCoalesce(Func func, Waiter& waiter)
      : func_{std::move(func)}, waiter_{waiter} {}

  void operator()() const {
    auto value = func_();
    new (&waiter_.storage_) ReturnType{std::move(value)};
  }

 private:
  Func func_;
  Waiter& waiter_;

  static_assert(!std::is_void<ReturnType>{}, "");
  static_assert(alignof(decltype(waiter_.storage_)) >= alignof(ReturnType), "");
  static_assert(sizeof(decltype(waiter_.storage_)) >= sizeof(ReturnType), "");
};

template <typename Func, typename Waiter>
class TaskWithoutCoalesce {
 public:
  using ReturnType = void;
  using StorageType = folly::Unit;
  explicit TaskWithoutCoalesce(Func func, Waiter&) : func_{std::move(func)} {}

  void operator()() const {
    func_();
  }

 private:
  Func func_;
};

template <typename Func, typename Waiter>
class TaskWithBigReturnValue {
 public:
  // Using storage that is aligned on the cacheline boundary helps us avoid a
  // situation where the data ends up being allocated on two separate
  // cachelines.  This would require the remote thread to pull in both lines
  // to issue a write.
  //
  // We also isolate the storage by appending some padding to the end to
  // ensure we avoid false-sharing with the metadata used while the waiter
  // waits
  using ReturnType = folly::invoke_result_t<const Func&>;
  static const auto kReturnValueAlignment = folly::constexpr_max(
      alignof(ReturnType),
      folly::hardware_destructive_interference_size);
  using StorageType = std::aligned_storage_t<
      sizeof(std::aligned_storage_t<sizeof(ReturnType), kReturnValueAlignment>),
      kReturnValueAlignment>;

  explicit TaskWithBigReturnValue(Func func, Waiter&)
      : func_{std::move(func)} {}

  void operator()() const {
    DCHECK(storage_);
    auto value = func_();
    new (storage_) ReturnType{std::move(value)};
  }

  void attach(StorageType* storage) {
    DCHECK(!storage_);
    storage_ = storage;
  }

 private:
  Func func_;
  StorageType* storage_{nullptr};

  static_assert(!std::is_void<ReturnType>{}, "");
  static_assert(sizeof(Waiter::storage_) < sizeof(ReturnType), "");
};

template <typename T, bool>
struct Sizeof_;
template <typename T>
struct Sizeof_<T, false> : index_constant<sizeof(T)> {};
template <typename T>
struct Sizeof_<T, true> : index_constant<0> {};
template <typename T>
struct Sizeof : Sizeof_<T, std::is_void<T>::value> {};

// we need to use std::integral_constant::value here as opposed to
// std::integral_constant::operator T() because MSVC errors out with the
// implicit conversion
template <typename Func, typename Waiter>
using CoalescedTask = std::conditional_t<
    std::is_void<folly::invoke_result_t<const Func&>>::value,
    TaskWithoutCoalesce<Func, Waiter>,
    std::conditional_t<
        Sizeof<folly::invoke_result_t<const Func&>>::value <=
            sizeof(Waiter::storage_),
        TaskWithCoalesce<Func, Waiter>,
        TaskWithBigReturnValue<Func, Waiter>>>;

/**
 * Given a request and a wait node, coalesce them into a CoalescedTask that
 * coalesces the return value into the wait node when invoked from a remote
 * thread
 *
 * When given a null request through nullptr_t, coalesce() returns null as well
 */
template <typename Waiter>
std::nullptr_t coalesce(std::nullptr_t&, Waiter&) {
  return nullptr;
}

template <
    typename Request,
    typename Waiter,
    typename Func = typename Request::F>
CoalescedTask<Func, Waiter> coalesce(Request& request, Waiter& waiter) {
  static_assert(!std::is_same<Request, std::nullptr_t>{}, "");
  return CoalescedTask<Func, Waiter>{request.func_, waiter};
}

/**
 * Given a task, create storage for the return value.  When we get a type
 * of CoalescedTask, this returns an instance of CoalescedTask::StorageType.
 * std::nullptr_t otherwise
 */
inline std::nullptr_t makeReturnValueStorageFor(std::nullptr_t&) {
  return {};
}

template <
    typename CoalescedTask,
    typename StorageType = typename CoalescedTask::StorageType>
StorageType makeReturnValueStorageFor(CoalescedTask&) {
  return {};
}

/**
 * Given a task and storage, attach them together if needed.  This only helps
 * when we have a task that returns a value bigger than can be coalesced.  In
 * that case, we need to attach the storage with the task so the return value
 * can be transferred to this thread from the remote thread
 */
template <typename Task, typename Storage>
void attach(Task&, Storage&) {
  static_assert(
      std::is_same<Storage, std::nullptr_t>{} ||
          std::is_same<Storage, folly::Unit>{},
      "");
}

template <
    typename R,
    typename W,
    typename StorageType = typename TaskWithBigReturnValue<R, W>::StorageType>
void attach(TaskWithBigReturnValue<R, W>& task, StorageType& storage) {
  task.attach(&storage);
}

template <typename Request, typename Waiter>
void throwIfExceptionOccurred(Request&, Waiter& waiter, bool exception) {
  using Storage = decltype(waiter.storage_);
  using F = typename Request::F;
  static_assert(sizeof(Storage) >= sizeof(std::exception_ptr), "");
  static_assert(alignof(Storage) >= alignof(std::exception_ptr), "");

  // we only need to check for an exception in the waiter struct if the passed
  // callable is not noexcept
  //
  // we need to make another instance of the exception with automatic storage
  // duration and destroy the exception held in the storage *before throwing* to
  // avoid leaks.  If we don't destroy the exception_ptr in storage, the
  // refcount for the internal exception will never hit zero, thereby leaking
  // memory
  if (UNLIKELY(!folly::is_nothrow_invocable_v<const F&> && exception)) {
    auto storage = &waiter.storage_;
    auto exc = folly::launder(reinterpret_cast<std::exception_ptr*>(storage));
    auto copy = std::move(*exc);
    exc->std::exception_ptr::~exception_ptr();
    std::rethrow_exception(std::move(copy));
  }
}

/**
 * Given a CoalescedTask, a wait node and a request.  Detach the return value
 * into the request from the wait node and task.
 */
template <typename Waiter>
void detach(std::nullptr_t&, Waiter&, bool exception, std::nullptr_t&) {
  DCHECK(!exception);
}

template <typename Waiter, typename F>
void detach(
    RequestWithoutReturn<F>& request,
    Waiter& waiter,
    bool exception,
    folly::Unit&) {
  throwIfExceptionOccurred(request, waiter, exception);
}

template <typename Waiter, typename F>
void detach(
    RequestWithReturn<F>& request,
    Waiter& waiter,
    bool exception,
    folly::Unit&) {
  throwIfExceptionOccurred(request, waiter, exception);

  using ReturnType = typename RequestWithReturn<F>::ReturnType;
  static_assert(!std::is_same<ReturnType, void>{}, "");
  static_assert(sizeof(waiter.storage_) >= sizeof(ReturnType), "");

  auto& val = *folly::launder(reinterpret_cast<ReturnType*>(&waiter.storage_));
  new (&request.value_) ReturnType{std::move(val)};
  val.~ReturnType();
}

template <typename Waiter, typename F, typename Storage>
void detach(
    RequestWithReturn<F>& request,
    Waiter& waiter,
    bool exception,
    Storage& storage) {
  throwIfExceptionOccurred(request, waiter, exception);

  using ReturnType = typename RequestWithReturn<F>::ReturnType;
  static_assert(!std::is_same<ReturnType, void>{}, "");
  static_assert(sizeof(storage) >= sizeof(ReturnType), "");

  auto& val = *folly::launder(reinterpret_cast<ReturnType*>(&storage));
  new (&request.value_) ReturnType{std::move(val)};
  val.~ReturnType();
}

/**
 * Get the time since epoch in nanoseconds
 *
 * This is faster than std::chrono::steady_clock because it avoids a VDSO
 * access to get the timestamp counter
 *
 * Note that the hardware timestamp counter on x86, like std::steady_clock is
 * guaranteed to be monotonically increasing -
 * https://c9x.me/x86/html/file_module_x86_id_278.html
 */
inline std::chrono::nanoseconds time() {
  return std::chrono::nanoseconds{hardware_timestamp()};
}

/**
 * Zero out the other bits used by the implementation and return just an
 * address from a uintptr_t
 */
template <typename Type>
Type* extractPtr(std::uintptr_t from) {
  // shift one bit off the end, to get all 1s followed by a single 0
  auto mask = std::numeric_limits<std::uintptr_t>::max();
  mask >>= 1;
  mask <<= 1;
  CHECK(!(mask & 0b1));

  return folly::bit_cast<Type*>(from & mask);
}

/**
 * Strips the given nanoseconds into only the least significant 56 bits by
 * moving the least significant 56 bits over by 8 zeroing out the bottom 8
 * bits to be used as a medium of information transfer for the thread wait
 * nodes
 */
inline std::uint64_t strip(std::chrono::nanoseconds t) {
  auto time = t.count();
  return static_cast<std::uint64_t>(time) << 8;
}

/**
 * Recover the timestamp value from an integer that has the timestamp encoded
 * in it
 */
inline std::uint64_t recover(std::uint64_t from) {
  return from >> 8;
}

template <template <typename> class Atomic, bool TimePublishing>
class DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy {
 public:
  // DistributedMutexStateProxy is move constructible and assignable for
  // convenience
  DistributedMutexStateProxy(DistributedMutexStateProxy&& other) {
    *this = std::move(other);
  }

  DistributedMutexStateProxy& operator=(DistributedMutexStateProxy&& other) {
    DCHECK(!(*this)) << "Cannot move into a valid DistributedMutexStateProxy";

    next_ = std::exchange(other.next_, nullptr);
    expected_ = std::exchange(other.expected_, 0);
    timedWaiters_ = std::exchange(other.timedWaiters_, false);
    combined_ = std::exchange(other.combined_, false);
    waker_ = std::exchange(other.waker_, 0);
    waiters_ = std::exchange(other.waiters_, nullptr);
    ready_ = std::exchange(other.ready_, nullptr);

    return *this;
  }

  // The proxy is valid when a mutex acquisition attempt was successful,
  // lock() is guaranteed to return a valid proxy, try_lock() is not
  explicit operator bool() const {
    return expected_;
  }

  // private:
  // friend the mutex class, since that will be accessing state private to
  // this class
  friend class DistributedMutex<Atomic, TimePublishing>;

  DistributedMutexStateProxy(
      Waiter<Atomic>* next,
      std::uintptr_t expected,
      bool timedWaiter = false,
      bool combined = false,
      std::uintptr_t waker = 0,
      Waiter<Atomic>* waiters = nullptr,
      Waiter<Atomic>* ready = nullptr)
      : next_{next},
        expected_{expected},
        timedWaiters_{timedWaiter},
        combined_{combined},
        waker_{waker},
        waiters_{waiters},
        ready_{ready} {}

  // the next thread that is to be woken up, this being null at the time of
  // unlock() shows that the current thread acquired the mutex without
  // contention or it was the terminal thread in the queue of threads waking up
  Waiter<Atomic>* next_{nullptr};
  // this is the value that the current thread should expect to find on
  // unlock, and if this value is not there on unlock, the current thread
  // should assume that other threads are enqueued waiting for the mutex
  //
  // note that if the mutex has the same state set at unlock time, and this is
  // set to an address (and not say kLocked in the case of a terminal waker)
  // then it must have been the case that no other thread had enqueued itself,
  // since threads in the domain of this mutex do not share stack space
  //
  // if we want to support stack sharing, we can solve the problem by looping
  // at lock time, and setting a variable that says whether we have acquired
  // the lock or not perhaps
  std::uintptr_t expected_{0};
  // a boolean that will be set when the mutex has timed waiters that the
  // current thread is responsible for waking, in such a case, the current
  // thread will issue an atomic_notify_one() call after unlocking the mutex
  //
  // note that a timed waiter will itself always have this flag set.  This is
  // done so we can avoid having to issue a atomic_notify_all() call (and
  // subsequently a thundering herd) when waking up timed-wait threads
  bool timedWaiters_{false};
  // a boolean that contains true if the state proxy is not meant to be passed
  // to the unlock() function.  This is set only when there is contention and
  // a thread had asked for its critical section to be combined
  bool combined_{false};
  // metadata passed along from the thread that woke this thread up
  std::uintptr_t waker_{0};
  // the list of threads that are waiting on a futex
  //
  // the current threads is meant to wake up this list of waiters if it is
  // able to commit an unlock() on the mutex without seeing a contention chain
  Waiter<Atomic>* waiters_{nullptr};
  // after a thread has woken up from a futex() call, it will have the rest of
  // the threads that it were waiting behind it in this list, a thread that
  // unlocks has to wake up threads from this list if it has any, before it
  // goes to sleep to prevent pathological unfairness
  Waiter<Atomic>* ready_{nullptr};
};

template <template <typename> class Atomic, bool TimePublishing>
DistributedMutex<Atomic, TimePublishing>::DistributedMutex()
    : state_{kUnlocked} {}

template <typename Waiter>
std::uint64_t publish(
    std::uint64_t spins,
    bool& shouldPublish,
    std::chrono::nanoseconds& previous,
    Waiter& waiter,
    std::uint32_t waitMode) {
  // time publishing has some overhead because it executes an atomic exchange on
  // the futex word.  If this line is in a remote thread (eg.  the combiner),
  // then each time we publish a timestamp, this thread has to submit an RFO to
  // the remote core for the cacheline, blocking progress for both threads.
  //
  // the remote core uses a store in the fast path - why then does an RFO make a
  // difference?  The only educated guess we have here is that the added
  // roundtrip delays draining of the store buffer, which essentially exerts
  // backpressure on future stores, preventing parallelization
  //
  // if we have requested a combine, time publishing is less important as it
  // only comes into play when the combiner has exhausted their max combine
  // passes.  So we defer time publishing to the point when the current thread
  // gets preempted
  auto current = time();
  if ((current - previous) >= kScheduledAwaySpinThreshold) {
    shouldPublish = true;
  }
  previous = current;

  // if we have requested a combine, and this is the first iteration of the
  // wait-loop, we publish a max timestamp to optimistically convey that we have
  // not yet been preempted (the remote knows the meaning of max timestamps)
  //
  // then if we are under the maximum number of spins allowed before sleeping,
  // we publish the exact timestamp, otherwise we publish the minimum possible
  // timestamp to force the waking thread to skip us
  auto now = ((waitMode == kCombineWaiting) && !spins)
      ? decltype(time())::max()
      : (spins < kMaxSpins) ? previous : decltype(time())::zero();

  // the wait mode information is published in the bottom 8 bits of the futex
  // word, the rest contains time information as computed above.  Overflows are
  // not really a correctness concern because time publishing is only a
  // heuristic.  This leaves us 56 bits of nanoseconds (2 years) before we hit
  // two consecutive wraparounds, so the lack of bits to respresent time is
  // neither a performance nor correctness concern
  auto data = strip(now) | waitMode;
  auto signal = (shouldPublish || !spins || (waitMode != kCombineWaiting))
      ? waiter.futex_.exchange(data, std::memory_order_acq_rel)
      : waiter.futex_.load(std::memory_order_acquire);
  return signal & std::numeric_limits<std::uint8_t>::max();
}

template <typename Waiter>
bool spin(Waiter& waiter, std::uint32_t& sig, std::uint32_t mode) {
  auto spins = std::uint64_t{0};
  auto waitMode = (mode == kCombineUninitialized) ? kCombineWaiting : kWaiting;
  auto previous = time();
  auto shouldPublish = false;
  while (true) {
    auto signal = publish(spins++, shouldPublish, previous, waiter, waitMode);

    // if we got skipped, make a note of it and return if we got a skipped
    // signal or a signal to wake up
    auto skipped = (signal == kSkipped);
    auto combined = (signal == kCombined);
    auto exceptionOccurred = (signal == kExceptionOccurred);
    auto woken = (signal == kWake);
    if (skipped || woken || combined || exceptionOccurred) {
      sig = static_cast<std::uint32_t>(signal);
      return !skipped;
    }

    // if we are under the spin threshold, pause to allow the other
    // hyperthread to run.  If not, then sleep
    if (spins < kMaxSpins) {
      asm_volatile_pause();
    } else {
      Sleeper::sleep();
    }
  }
}

template <typename Waiter>
void doFutexWake(Waiter* waiter) {
  if (waiter) {
    // We can use a simple store operation here and not worry about checking
    // to see if the thread had actually started waiting on the futex, that is
    // already done in tryWake() when a sleeping thread is collected
    //
    // We now do not know whether the waiter had already enqueued on the futex
    // or whether it had just stored kSleeping in its futex and was about to
    // call futexWait().  We treat both these scenarios the same
    //
    // the below can theoretically cause a problem if we set the
    // wake signal and the waiter was in between setting kSleeping in its
    // futex and enqueueing on the futex.  In this case the waiter will just
    // return from futexWait() immediately.  This leaves the address that the
    // waiter was using for futexWait() possibly dangling, and the thread that
    // we woke in the exchange above might have used that address for some
    // other object
    //
    // however, even if the thread had indeed woken up simply becasue of the
    // above exchange(), the futexWake() below is not incorrect.  It is not
    // incorrect because futexWake() does not actually change the memory of
    // the futex word.  It just uses the address to do a lookup in the kernel
    // futex table.  And even if we call futexWake() on some other address,
    // and that address was being used to wait on futex() that thread will
    // protect itself from spurious wakeups, check the value in the futex word
    // and enqueue itself back on the futex
    //
    // this dangilng pointer possibility is why we use a pointer to the futex
    // word, and avoid dereferencing after the store() operation
    auto sleeper = &waiter->metadata_.sleeper_;
    sleeper->store(kWake, std::memory_order_release);
    futexWake(sleeper, 1);
  }
}

template <typename Waiter>
bool doFutexWait(Waiter* waiter, Waiter*& next) {
  // first we get ready to sleep by calling exchange() on the futex with a
  // kSleeping value
  DCHECK(waiter->futex_.load(std::memory_order_relaxed) == kAboutToWait);

  // note the semantics of using a futex here, when we exchange the sleeper_
  // with kSleeping, we are getting ready to sleep, but before sleeping we get
  // ready to sleep, and we return from futexWait() when the value of
  // sleeper_ might have changed.  We can also wake up because of a spurious
  // wakeup, so we always check against the value in sleeper_ after returning
  // from futexWait(), if the value is not kWake, then we continue
  auto pre =
      waiter->metadata_.sleeper_.exchange(kSleeping, std::memory_order_acq_rel);

  // Seeing a kSleeping on a futex word before we set it ourselves means only
  // one thing - an unlocking thread caught us before we went to futex(), and
  // we now have the lock, so we abort
  //
  // if we were given an early delivery, we can return from this function with
  // a true, meaning that we now have the lock
  if (pre == kSleeping) {
    return true;
  }

  // if we reach here then were were not given an early delivery, and any
  // thread that goes to wake us up will see a consistent view of the rest of
  // the contention chain (since the next_ variable is set before the
  // kSleeping exchange above)
  while (pre != kWake) {
    // before enqueueing on the futex, we wake any waiters that we were
    // possibly responsible for
    doFutexWake(std::exchange(next, nullptr));

    // then we wait on the futex
    //
    // note that we have to protect ourselves against spurious wakeups here.
    // Because the corresponding futexWake() above does not synchronize
    // wakeups around the futex word.  Because doing so would become
    // inefficient
    futexWait(&waiter->metadata_.sleeper_, kSleeping);
    pre = waiter->metadata_.sleeper_.load(std::memory_order_acquire);
    DCHECK((pre == kSleeping) || (pre == kWake));
  }

  // when coming out of a futex, we might have some other sleeping threads
  // that we were supposed to wake up, assign that to the next pointer
  DCHECK(next == nullptr);
  next = extractPtr<Waiter>(waiter->next_.load(std::memory_order_relaxed));
  return false;
}

template <typename Waiter>
bool wait(Waiter* waiter, std::uint32_t mode, Waiter*& next, uint32_t& signal) {
  if (mode == kAboutToWait) {
    return doFutexWait(waiter, next);
  }

  return spin(*waiter, signal, mode);
}

inline void recordTimedWaiterAndClearTimedBit(
    bool& timedWaiter,
    std::uintptr_t& previous) {
  // the previous value in the mutex can never be kTimedWaiter, timed waiters
  // always set (kTimedWaiter | kLocked) in the mutex word when they try and
  // acquire the mutex
  DCHECK(previous != kTimedWaiter);

  if (UNLIKELY(previous & kTimedWaiter)) {
    // record whether there was a timed waiter in the previous mutex state, and
    // clear the timed bit from the previous state
    timedWaiter = true;
    previous = previous & (~kTimedWaiter);
  }
}

template <typename Atomic>
void wakeTimedWaiters(Atomic* state, bool timedWaiters) {
  if (UNLIKELY(timedWaiters)) {
    atomic_notify_one(state);
  }
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Func>
auto DistributedMutex<Atomic, TimePublishing>::lock_combine(Func func)
    -> folly::invoke_result_t<const Func&> {
  // invoke the lock implementation function and check whether we came out of
  // it with our task executed as a combined critical section.  This usually
  // happens when the mutex is contended.
  //
  // In the absence of contention, we just return from the try_lock() function
  // with the lock acquired.  So we need to invoke the task and unlock
  // the mutex before returning
  auto&& task = Request<Func>{func};
  auto&& state = lockImplementation(*this, state_, task);
  if (!state.combined_) {
    // to avoid having to play a return-value dance when the combinable
    // returns void, we use a scope exit to perform the unlock after the
    // function return has been processed
    SCOPE_EXIT {
      unlock(std::move(state));
    };
    return func();
  }

  // if we are here, that means we were able to get our request combined, we
  // can return the value that was transferred to us
  //
  // each thread that enqueues as a part of a contention chain takes up the
  // responsibility of any timed waiter that had come immediately before it,
  // so we wake up timed waiters before exiting the lock function.  Another
  // strategy might be to add the timed waiter information to the metadata and
  // let a single leader wake up a timed waiter for better concurrency.  But
  // this has proven not to be useful in benchmarks beyond a small 5% delta,
  // so we avoid taking the complexity hit and branch to wake up timed waiters
  // from each thread
  wakeTimedWaiters(&state_, state.timedWaiters_);
  return std::move(task).get();
}

template <template <typename> class Atomic, bool TimePublishing>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::lock() {
  auto null = nullptr;
  return lockImplementation(*this, state_, null);
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Rep, typename Period, typename Func>
folly::Optional<invoke_result_t<Func&>>
DistributedMutex<Atomic, TimePublishing>::try_lock_combine_for(
    const std::chrono::duration<Rep, Period>& duration,
    Func func) {
  auto state = try_lock_for(duration);
  if (state) {
    SCOPE_EXIT {
      unlock(std::move(state));
    };
    return func();
  }

  return folly::none;
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Clock, typename Duration, typename Func>
folly::Optional<invoke_result_t<Func&>>
DistributedMutex<Atomic, TimePublishing>::try_lock_combine_until(
    const std::chrono::time_point<Clock, Duration>& deadline,
    Func func) {
  auto state = try_lock_until(deadline);
  if (state) {
    SCOPE_EXIT {
      unlock(std::move(state));
    };
    return func();
  }

  return folly::none;
}

template <typename Atomic, template <typename> class A, bool T>
auto tryLockNoLoad(Atomic& atomic, DistributedMutex<A, T>&) {
  // Try and set the least significant bit of the centralized lock state to 1,
  // if this succeeds, it must have been the case that we had a kUnlocked (or
  // 0) in the central storage before, since that is the only case where a 0
  // can be found in the least significant bit
  //
  // If this fails, then it is a no-op
  using Proxy = typename DistributedMutex<A, T>::DistributedMutexStateProxy;
  auto previous = atomic_fetch_set(atomic, 0, std::memory_order_acquire);
  if (!previous) {
    return Proxy{nullptr, kLocked};
  }

  return Proxy{nullptr, 0};
}

template <template <typename> class Atomic, bool TimePublishing>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::try_lock() {
  // The lock attempt below requires an expensive atomic fetch-and-mutate or
  // an even more expensive atomic compare-and-swap loop depending on the
  // platform.  These operations require pulling the lock cacheline into the
  // current core in exclusive mode and are therefore hard to parallelize
  //
  // This probabilistically avoids the expense by first checking whether the
  // mutex is currently locked
  if (state_.load(std::memory_order_relaxed) != kUnlocked) {
    return DistributedMutexStateProxy{nullptr, 0};
  }

  return tryLockNoLoad(state_, *this);
}

template <
    template <typename> class Atomic,
    bool TimePublishing,
    typename State,
    typename Request>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
lockImplementation(
    DistributedMutex<Atomic, TimePublishing>& mutex,
    State& atomic,
    Request& request) {
  // first try and acquire the lock as a fast path, the underlying
  // implementation is slightly faster than using std::atomic::exchange() as
  // is used in this function.  So we get a small perf boost in the
  // uncontended case
  //
  // We only go through this fast path for the lock/unlock usage and avoid this
  // for combined critical sections.  This check adds unnecessary overhead in
  // that case as it causes an extra cacheline bounce
  constexpr auto combineRequested = !std::is_same<Request, std::nullptr_t>{};
  if (!combineRequested) {
    if (auto state = tryLockNoLoad(atomic, mutex)) {
      return state;
    }
  }

  auto previous = std::uintptr_t{0};
  auto waitMode = combineRequested ? kCombineUninitialized : kUninitialized;
  auto nextWaitMode = kAboutToWait;
  auto timedWaiter = false;
  Waiter<Atomic>* nextSleeper = nullptr;
  while (true) {
    // construct the state needed to wait
    //
    // We can't use auto here because MSVC errors out due to a missing copy
    // constructor
    Waiter<Atomic> state{};
    auto&& task = coalesce(request, state);
    auto&& storage = makeReturnValueStorageFor(task);
    auto&& address = folly::bit_cast<std::uintptr_t>(&state);
    attach(task, storage);
    state.initialize(waitMode, std::move(task));
    DCHECK(!(address & 0b1));

    // set the locked bit in the address we will be persisting in the mutex
    address |= kLocked;

    // attempt to acquire the mutex, mutex acquisition is successful if the
    // previous value is zeroed out
    //
    // we use memory_order_acq_rel here because we want the read-modify-write
    // operation to be both acquire and release.  Acquire becasue if this is a
    // successful lock acquisition, we want to acquire state any other thread
    // has released from a prior unlock.  We want release semantics becasue
    // other threads that read the address of this value should see the full
    // well-initialized node we are going to wait on if the mutex acquisition
    // was unsuccessful
    previous = atomic.exchange(address, std::memory_order_acq_rel);
    recordTimedWaiterAndClearTimedBit(timedWaiter, previous);
    state.next_.store(previous, std::memory_order_relaxed);
    if (previous == kUnlocked) {
      return {/* next */ nullptr,
              /* expected */ address,
              /* timedWaiter */ timedWaiter,
              /* combined */ false,
              /* waker */ 0,
              /* waiters */ nullptr,
              /* ready */ nextSleeper};
    }
    DCHECK(previous & kLocked);

    // wait until we get a signal from another thread, if this returns false,
    // we got skipped and had probably been scheduled out, so try again
    auto signal = kUninitialized;
    if (!wait(&state, waitMode, nextSleeper, signal)) {
      std::swap(waitMode, nextWaitMode);
      continue;
    }

    // at this point it is safe to access the other fields in the waiter state,
    // since the thread that woke us up is gone and nobody will be touching this
    // state again, note that this requires memory ordering, and this is why we
    // use memory_order_acquire (among other reasons) in the above wait
    //
    // first we see if the value we took off the mutex state was the thread that
    // initated the wakeups, if so, we are the terminal node of the current
    // contention chain.  If we are the terminal node, then we should expect to
    // see a kLocked in the mutex state when we unlock, if we see that, we can
    // commit the unlock to the centralized mutex state.  If not, we need to
    // continue wakeups
    //
    // a nice consequence of passing kLocked as the current address if we are
    // the terminal node is that it naturally just works with the algorithm.  If
    // we get a contention chain when coming out of a contention chain, the tail
    // of the new contention chain will have kLocked set as the previous, which,
    // as it happens "just works", since we have now established a recursive
    // relationship until broken
    auto next = previous;
    auto expected = address;
    if (previous == state.metadata_.waker_) {
      next = 0;
      expected = kLocked;
    }

    // if we were given a combine signal, detach the return value from the
    // wait struct into the request, so the current thread can access it
    // outside this function
    auto combined = (signal == kCombined);
    auto exceptionOccurred = (signal == kExceptionOccurred);
    if (combined || exceptionOccurred) {
      detach(request, state, exceptionOccurred, storage);
    }

    // if we are just coming out of a futex call, then it means that the next
    // waiter we are responsible for is also a waiter waiting on a futex, so
    // we return that list in the list of ready threads.  We wlil be waking up
    // the ready threads on unlock no matter what
    return {/* next */ extractPtr<Waiter<Atomic>>(next),
            /* expected */ expected,
            /* timedWaiter */ timedWaiter,
            /* combined */ combineRequested && (combined || exceptionOccurred),
            /* waker */ state.metadata_.waker_,
            /* waiters */ extractPtr<Waiter<Atomic>>(state.metadata_.waiters_),
            /* ready */ nextSleeper};
  }
}

inline bool preempted(std::uint64_t value, std::chrono::nanoseconds now) {
  auto currentTime = recover(strip(now));
  auto nodeTime = recover(value);
  auto preempted =
      (currentTime > nodeTime + kScheduledAwaySpinThreshold.count()) &&
      (nodeTime != recover(strip(std::chrono::nanoseconds::max())));

  // we say that the thread has been preempted if its timestamp says so, and
  // also if it is neither uninitialized nor skipped
  DCHECK(value != kSkipped);
  return (preempted) && (value != kUninitialized) &&
      (value != kCombineUninitialized);
}

inline bool isSleeper(std::uintptr_t value) {
  return (value == kAboutToWait);
}

inline bool isInitialized(std::uintptr_t value) {
  return (value != kUninitialized) && (value != kCombineUninitialized);
}

inline bool isCombiner(std::uintptr_t value) {
  auto mode = (value & 0xff);
  return (mode == kCombineWaiting) || (mode == kCombineUninitialized);
}

inline bool isWaitingCombiner(std::uintptr_t value) {
  return (value & 0xff) == kCombineWaiting;
}

template <typename Waiter>
CombineFunction loadTask(Waiter* current, std::uintptr_t value) {
  // if we know that the waiter is a combiner of some sort, it is safe to read
  // and copy the value of the function in the waiter struct, since we know
  // that a waiter would have set it before enqueueing
  if (isCombiner(value)) {
    return current->function_;
  }

  return nullptr;
}

template <typename Waiter>
FOLLY_COLD void transferCurrentException(Waiter* waiter) {
  DCHECK(std::current_exception());
  new (&waiter->storage_) std::exception_ptr{std::current_exception()};
  waiter->futex_.store(kExceptionOccurred, std::memory_order_release);
}

template <template <typename> class Atomic>
FOLLY_ALWAYS_INLINE std::uintptr_t tryCombine(
    Waiter<Atomic>* waiter,
    std::uintptr_t value,
    std::uintptr_t next,
    std::uint64_t iteration,
    std::chrono::nanoseconds now,
    CombineFunction task) {
  // if the waiter has asked for a combine operation, we should combine its
  // critical section and move on to the next waiter
  //
  // the waiter is combinable if the following conditions are satisfied
  //
  //  1) the state in the futex word is not uninitialized (kUninitialized)
  //  2) it has a valid combine function
  //  3) we are not past the limit of the number of combines we can perform
  //     or the waiter thread been preempted.  If the waiter gets preempted,
  //     its better to just execute their critical section before moving on.
  //     As they will have to re-queue themselves after preemption anyway,
  //     leading to further delays in critical section completion
  //
  // if all the above are satisfied, then we can combine the critical section.
  // Note that if the waiter is in a combineable state, that means that it had
  // finished its writes to both the task and the next_ value.  And observing
  // a waiting state also means that we have acquired the writes to the other
  // members of the waiter struct, so it's fine to use those values here
  if (isWaitingCombiner(value) &&
      (iteration <= kMaxCombineIterations || preempted(value, now))) {
    try {
      task();
      waiter->futex_.store(kCombined, std::memory_order_release);
    } catch (...) {
      transferCurrentException(waiter);
    }
    return next;
  }

  return 0;
}

template <typename Waiter>
FOLLY_ALWAYS_INLINE std::uintptr_t tryWake(
    bool publishing,
    Waiter* waiter,
    std::uintptr_t value,
    std::uintptr_t next,
    std::uintptr_t waker,
    Waiter*& sleepers,
    std::uint64_t iteration,
    CombineFunction task) {
  // try and combine the waiter's request first, if that succeeds that means
  // we have successfully executed their critical section and can move on to
  // the rest of the chain
  auto now = time();
  if (tryCombine(waiter, value, next, iteration, now, task)) {
    return next;
  }

  // first we see if we can wake the current thread that is spinning
  if ((!publishing || !preempted(value, now)) && !isSleeper(value)) {
    // the Metadata class should be trivially destructible as we use placement
    // new to set the relevant metadata without calling any destructor.  We
    // need to use placement new because the class contains a futex, which is
    // non-movable and non-copyable
    using Metadata = std::decay_t<decltype(waiter->metadata_)>;
    static_assert(std::is_trivially_destructible<Metadata>{}, "");

    // we need release here because of the write to waker_ and also because we
    // are unlocking the mutex, the thread we do the handoff to here should
    // see the modified data
    new (&waiter->metadata_) Metadata{waker, bit_cast<uintptr_t>(sleepers)};
    waiter->futex_.store(kWake, std::memory_order_release);
    return 0;
  }

  // if the thread is not a sleeper, and we were not able to catch it before
  // preemption, we can just return a false, it is safe to read next_ because
  // the thread was preempted.  Preemption signals can only come after the
  // thread has set the next_ pointer, since the timestamp writes only start
  // occurring after that point
  //
  // if a thread was preempted it must have stored next_ in the waiter struct,
  // as the store to futex_ that resets the value from kUninitialized happens
  // after the write to next
  CHECK(publishing);
  if (!isSleeper(value)) {
    // go on to the next one
    //
    // Also, we need a memory_order_release here to prevent missed wakeups.  A
    // missed wakeup here can happen when we see that a thread had been
    // preempted and skip it.  Then go on to release the lock, and then when
    // the thread which got skipped does an exchange on the central storage,
    // still sees the locked bit, and never gets woken up
    //
    // Can we relax this?
    DCHECK(preempted(value, now));
    DCHECK(!isCombiner(value));
    next = waiter->next_.load(std::memory_order_relaxed);
    waiter->futex_.store(kSkipped, std::memory_order_release);
    return next;
  }

  // if we are here the thread is a sleeper
  //
  // we attempt to catch the thread before it goes to futex().  If we are able
  // to catch the thread before it sleeps on a futex, we are done, and don't
  // need to go any further
  //
  // if we are not able to catch the thread before it goes to futex, we
  // collect the current thread in the list of sleeping threads represented by
  // sleepers, and return the next thread in the list and return false along
  // with the previous next value
  //
  // it is safe to read the next_ pointer in the waiter struct if we were
  // unable to catch the thread before it went to futex() because we use
  // acquire-release ordering for the exchange operation below.  And if we see
  // that the thread was already sleeping, we have synchronized with the write
  // to next_ in the context of the sleeping thread
  //
  // Also we need to set the value of waiters_ and waker_ in the thread before
  // doing the exchange because we need to pass on the list of sleepers in the
  // event that we were able to catch the thread before it went to futex().
  // If we were unable to catch the thread before it slept, these fields will
  // be ignored when the thread wakes up anyway
  DCHECK(isSleeper(value));
  waiter->metadata_.waker_ = waker;
  waiter->metadata_.waiters_ = folly::bit_cast<std::uintptr_t>(sleepers);
  auto pre =
      waiter->metadata_.sleeper_.exchange(kSleeping, std::memory_order_acq_rel);

  // we were able to catch the thread before it went to sleep, return true
  if (pre != kSleeping) {
    return 0;
  }

  // otherwise return false, with the value of next_, it is safe to read next
  // because of the same logic as when a thread was preempted
  //
  // we also need to collect this sleeper in the list of sleepers being built
  // up
  next = waiter->next_.load(std::memory_order_relaxed);
  auto head = folly::bit_cast<std::uintptr_t>(sleepers);
  waiter->next_.store(head, std::memory_order_relaxed);
  sleepers = waiter;
  return next;
}

template <typename Waiter>
bool wake(
    bool publishing,
    Waiter& waiter,
    std::uintptr_t waker,
    Waiter*& sleepers,
    std::uint64_t iter) {
  // loop till we find a node that is either at the end of the list (as
  // specified by waker) or we find a node that is active (as specified by
  // the last published timestamp of the node)
  auto current = &waiter;
  while (current) {
    // it is important that we load the value of function and next_ after the
    // initial acquire load.  This is required because we need to synchronize
    // with the construction of the waiter struct before reading from it
    //
    // the load from the next_ variable is an optimistic load that assumes
    // that the waiting thread has probably gone to the waiting state.  If the
    // waiitng thread is in the waiting state (as revealed by the acquire load
    // from the futex word), we will see a well formed next_ value because it
    // happens-before the release store to the futex word.  The atomic load from
    // next_ is an optimization to avoid branching before loading and prevent
    // the compiler from eliding the load altogether (and using a pointer
    // dereference when needed)
    auto value = current->futex_.load(std::memory_order_acquire);
    auto next = current->next_.load(std::memory_order_relaxed);
    auto task = loadTask(current, value);
    next =
        tryWake(publishing, current, value, next, waker, sleepers, iter, task);

    // if there is no next node, we have managed to wake someone up and have
    // successfully migrated the lock to another thread
    if (!next) {
      return true;
    }

    // we need to read the value of the next node in the list before skipping
    // it, this is because after we skip it the node might wake up and enqueue
    // itself, and thereby gain a new next node
    CHECK(publishing);
    current = (next == waker) ? nullptr : extractPtr<Waiter>(next);
  }

  return false;
}

template <typename Atomic, typename Proxy, typename Sleepers>
bool tryUnlockClean(Atomic& state, Proxy& proxy, Sleepers sleepers) {
  auto expected = proxy.expected_;
  while (true) {
    if (state.compare_exchange_strong(
            expected,
            kUnlocked,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      // if we were able to commit an unlocked, we need to wake up the futex
      // waiters, if any
      doFutexWake(sleepers);
      return true;
    }

    // if we failed the compare_exchange_strong() above, we check to see if
    // the failure was because of the presence of a timed waiter.  If that
    // was the case then we try one more time with the kTimedWaiter bit set
    if (UNLIKELY(expected == (proxy.expected_ | kTimedWaiter))) {
      proxy.timedWaiters_ = true;
      continue;
    }

    // otherwise break, we have a contention chain
    return false;
  }
}

template <template <typename> class Atomic, bool Publish>
void DistributedMutex<Atomic, Publish>::unlock(
    DistributedMutex::DistributedMutexStateProxy proxy) {
  // we always wake up ready threads and timed waiters if we saw either
  DCHECK(proxy) << "Invalid proxy passed to DistributedMutex::unlock()";
  DCHECK(!proxy.combined_) << "Cannot unlock mutex after a successful combine";
  SCOPE_EXIT {
    doFutexWake(proxy.ready_);
    wakeTimedWaiters(&state_, proxy.timedWaiters_);
  };

  // if there is a wait queue we are responsible for, try and start wakeups,
  // don't bother with the mutex state
  auto sleepers = proxy.waiters_;
  if (proxy.next_) {
    if (wake(Publish, *proxy.next_, proxy.waker_, sleepers, 0)) {
      return;
    }

    // At this point, if are in the if statement, we were not the terminal
    // node of the wakeup chain.  Terminal nodes have the next_ pointer set to
    // null in lock()
    //
    // So we need to pretend we were the end of the contention chain.  Coming
    // out of a contention chain always has the kLocked state set in the
    // mutex.  Unless there is another contention chain lined up, which does
    // not matter since we are the terminal node anyway
    proxy.expected_ = kLocked;
  }

  for (std::uint64_t i = 0; true; ++i) {
    // otherwise, since we don't have anyone we need to wake up, we try and
    // release the mutex just as is
    //
    // if this is successful, we can return, the unlock was successful, we have
    // committed a nice kUnlocked to the central storage, yay
    if (tryUnlockClean(state_, proxy, sleepers)) {
      return;
    }

    // here we have a contention chain built up on the mutex.  We grab the
    // wait queue and start executing wakeups.  We leave a locked bit on the
    // centralized storage and handoff control to the head of the queue
    //
    // we use memory_order_acq_rel here because we want to see the
    // full well-initialized node that the other thread is waiting on
    //
    // If we are unable to wake the contention chain, it is possible that when
    // we come back to looping here, a new contention chain will form.  In
    // that case we need to use kLocked as the waker_ value because the
    // terminal node of the new chain will see kLocked in the central storage
    auto head = state_.exchange(kLocked, std::memory_order_acq_rel);
    recordTimedWaiterAndClearTimedBit(proxy.timedWaiters_, head);
    auto next = extractPtr<Waiter<Atomic>>(head);
    auto expected = std::exchange(proxy.expected_, kLocked);
    DCHECK((head & kLocked) && (head != kLocked)) << "incorrect state " << head;
    if (wake(Publish, *next, expected, sleepers, i)) {
      break;
    }
  }
}

template <typename Atomic, typename Deadline, typename MakeProxy>
auto timedLock(Atomic& state, Deadline deadline, MakeProxy proxy) {
  while (true) {
    // we put a bit on the central state to show that there is a timed waiter
    // and go to sleep on the central state
    //
    // when this thread goes to unlock the mutex, it will expect a 0b1 in the
    // mutex state (0b1, not 0b11), but then it will see that the value in the
    // mutex state is 0b11 and not 0b1, meaning that there might have been
    // another timed waiter.  Even though there might not have been another
    // timed waiter in the time being.  This sort of missed wakeup is
    // desirable for timed waiters; it helps avoid thundering herds of timed
    // waiters.  Because the mutex is packed in 8 bytes, and we need an
    // address to be stored in those 8 bytes, we don't have much room to play
    // with.  The only other solution is to issue a futexWake(INT_MAX) to wake
    // up all waiters when a clean unlock is committed, when a thread saw a
    // timed waiter in the mutex previously.
    //
    // putting a 0b11 here works for a set of reasons that is a superset of
    // the set of reasons that make it okay to put a kLocked (0b1) in the
    // mutex state.  Now that the thread has put (kTimedWaiter | kLocked)
    // (0b11) in the mutex state and it expects a kLocked (0b1), there are two
    // scenarios possible.  The first being when there is no contention chain
    // formation in the mutex from the time a timed waiter got a lock to
    // unlock.  In this case, the unlocker sees a 0b11 in the mutex state,
    // adjusts to the presence of a timed waiter and cleanly unlocks with a
    // kUnlocked (0b0).  The second is when there is a contention chain.
    // When a thread puts its address in the mutex and sees the timed bit, it
    // records the presence of a timed waiter, and then pretends as if it
    // hadn't seen the timed bit.  So future contention chain releases, will
    // terminate with a kLocked (0b1) and not a (kLocked | kTimedWaiter)
    // (0b11).  This just works naturally with the rest of the algorithm
    // without incurring a perf hit for the regular non-timed case
    //
    // this strategy does however mean, that when threads try to acquire the
    // mutex and all time out, there will be a wasteful syscall to issue wakeups
    // to waiting threads.  We don't do anything to try and minimize this
    //
    // we need to use a fetch_or() here because we need to convey two bits of
    // information - 1, whether the mutex is locked or not, and 2, whether
    // there is a timed waiter.  The alternative here is to use the second bit
    // to convey information only, we can use a fetch_set() on the second bit
    // to make this faster, but that comes at the expense of requiring regular
    // fast path lock attempts.  Which use a single bit read-modify-write for
    // better performance
    auto data = kTimedWaiter | kLocked;
    auto previous = state.fetch_or(data, std::memory_order_acquire);
    if (!(previous & 0b1)) {
      DCHECK(!previous);
      return proxy(nullptr, kLocked, true);
    }

    // wait on the futex until signalled, if we get a timeout, the try_lock
    // fails
    auto result = atomic_wait_until(&state, previous | data, deadline);
    if (result == std::cv_status::timeout) {
      return proxy(nullptr, std::uintptr_t{0}, false);
    }
  }
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Clock, typename Duration>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::try_lock_until(
    const std::chrono::time_point<Clock, Duration>& deadline) {
  // fast path for the uncontended case
  //
  // we get the time after trying to acquire the mutex because in the
  // uncontended case, the price of getting the time is about 1/3 of the
  // actual mutex acquisition.  So we only pay the price of that extra bit of
  // latency when needed
  //
  // this is even higher when VDSO is involved on architectures that do not
  // offer a direct interface to the timestamp counter
  if (auto state = try_lock()) {
    return state;
  }

  // fall back to the timed locking algorithm
  using Proxy = DistributedMutexStateProxy;
  return timedLock(state_, deadline, [](auto... as) { return Proxy{as...}; });
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Rep, typename Period>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::try_lock_for(
    const std::chrono::duration<Rep, Period>& duration) {
  // fast path for the uncontended case.  Reasoning for doing this here is the
  // same as in try_lock_until()
  if (auto state = try_lock()) {
    return state;
  }

  // fall back to the timed locking algorithm
  using Proxy = DistributedMutexStateProxy;
  auto deadline = std::chrono::steady_clock::now() + duration;
  return timedLock(state_, deadline, [](auto... as) { return Proxy{as...}; });
}
} // namespace distributed_mutex
} // namespace detail
} // namespace folly
