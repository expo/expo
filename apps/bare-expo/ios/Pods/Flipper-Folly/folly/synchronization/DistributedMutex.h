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

#include <folly/Optional.h>
#include <folly/functional/Invoke.h>

#include <atomic>
#include <chrono>
#include <cstdint>

namespace folly {
namespace detail {
namespace distributed_mutex {

/**
 * DistributedMutex is a small, exclusive-only mutex that distributes the
 * bookkeeping required for mutual exclusion in the stacks of threads that are
 * contending for it.  It has a mode that can combine critical sections when
 * the mutex experiences contention; this allows the implementation to elide
 * several expensive coherence and synchronization operations to boost
 * throughput, surpassing even atomic instructions in some cases.  It has a
 * smaller memory footprint than std::mutex, a similar level of fairness
 * (better in some cases) and no dependencies on heap allocation.  It is the
 * same width as a single pointer (8 bytes on most platforms), where on the
 * other hand, std::mutex and pthread_mutex_t are both 40 bytes.  It is larger
 * than some of the other smaller locks, but the wide majority of cases using
 * the small locks are wasting the difference in alignment padding anyway
 *
 * Benchmark results are good - at the time of writing, in the contended case,
 * for lock/unlock based critical sections, it is about 4-5x faster than the
 * smaller locks and about ~2x faster than std::mutex.  When used in
 * combinable mode, it is much faster than the alternatives, going more than
 * 10x faster than the small locks, about 6x faster than std::mutex, 2-3x
 * faster than flat combining and even faster than std::atomic<> in some
 * cases, allowing more work with higher throughput.  In the uncontended case,
 * it is a few cycles faster than folly::MicroLock but a bit slower than
 * std::mutex.  DistributedMutex is also resistent to tail latency pathalogies
 * unlike many of the other mutexes in use, which sleep for large time
 * quantums to reduce spin churn, this causes elevated latencies for threads
 * that enter the sleep cycle.  The tail latency of lock acquisition can go up
 * to 10x lower because of a more deterministic scheduling algorithm that is
 * managed almost entirely in userspace.  Detailed results comparing the
 * throughput and latencies of different mutex implementations and atomics are
 * at the bottom of folly/synchronization/test/SmallLocksBenchmark.cpp
 *
 * Theoretically, write locks promote concurrency when the critical sections
 * are small as most of the work is done outside the lock.  And indeed,
 * performant concurrent applications go through several pains to limit the
 * amount of work they do while holding a lock.  However, most times, the
 * synchronization and scheduling overhead of a write lock in the critical
 * path is so high, that after a certain point, making critical sections
 * smaller does not actually increase the concurrency of the application and
 * throughput plateaus.  DistributedMutex moves this breaking point to the
 * level of hardware atomic instructions, so applications keep getting
 * concurrency even under very high contention.  It does this by reducing
 * cache misses and contention in userspace and in the kernel by making each
 * thread wait on a thread local node and futex.  When combined critical
 * sections are used DistributedMutex leverages template metaprogramming to
 * allow the mutex to make better synchronization decisions based on the
 * layout of the input and output data.  This allows threads to keep working
 * only on their own cache lines without requiring cache coherence operations
 * when a mutex experiences heavy contention
 *
 * Non-timed mutex acquisitions are scheduled through intrusive LIFO
 * contention chains.  Each thread starts by spinning for a short quantum and
 * falls back to two phased sleeping.  Enqueue operations are lock free and
 * are piggybacked off mutex acquisition attempts.  The LIFO behavior of a
 * contention chain is good in the case where the mutex is held for a short
 * amount of time, as the head of the chain is likely to not have slept on
 * futex() after exhausting its spin quantum.  This allow us to avoid
 * unnecessary traversal and syscalls in the fast path with a higher
 * probability.  Even though the contention chains are LIFO, the mutex itself
 * does not adhere to that scheduling policy globally.  During contention,
 * threads that fail to lock the mutex form a LIFO chain on the central mutex
 * state, this chain is broken when a wakeup is scheduled, and future enqueue
 * operations form a new chain.  This makes the chains themselves LIFO, but
 * preserves global fairness through a constant factor which is limited to the
 * number of concurrent failed mutex acquisition attempts.  This binds the
 * last in first out behavior to the number of contending threads and helps
 * prevent starvation and latency outliers
 *
 * This strategy of waking up wakers one by one in a queue does not scale well
 * when the number of threads goes past the number of cores.  At which point
 * preemption causes elevated lock acquisition latencies.  DistributedMutex
 * implements a hardware timestamp publishing heuristic to detect and adapt to
 * preemption.
 *
 * DistributedMutex does not have the typical mutex API - it does not satisfy
 * the Lockable concept.  It requires the user to maintain ephemeral bookkeeping
 * and pass that bookkeeping around to unlock() calls.  The API overhead,
 * however, comes for free when you wrap this mutex for usage with
 * std::unique_lock, which is the recommended usage (std::lock_guard, in
 * optimized mode, has no performance benefit over std::unique_lock, so has been
 * omitted).  A benefit of this API is that it disallows incorrect usage where a
 * thread unlocks a mutex that it does not own, thinking a mutex is functionally
 * identical to a binary semaphore, which, unlike a mutex, is a suitable
 * primitive for that usage
 *
 * Combined critical sections allow the implementation to elide several
 * expensive operations during the lifetime of a critical section that cause
 * slowdowns with regular lock/unlock based usage.  DistributedMutex resolves
 * contention through combining up to a constant factor of 2 contention chains
 * to prevent issues with fairness and latency outliers, so we retain the
 * fairness benefits of the lock/unlock implementation with no noticeable
 * regression when switching between the lock methods.  Despite the efficiency
 * benefits, combined critical sections can only be used when the critical
 * section does not depend on thread local state and does not introduce new
 * dependencies between threads when the critical section gets combined.  For
 * example, locking or unlocking an unrelated mutex in a combined critical
 * section might lead to unexpected results or even undefined behavior.  This
 * can happen if, for example, a different thread unlocks a mutex locked by
 * the calling thread, leading to undefined behavior as the mutex might not
 * allow locking and unlocking from unrelated threads (the posix and C++
 * standard disallow this usage for their mutexes)
 *
 * Timed locking through DistributedMutex is implemented through a centralized
 * algorithm.  The underlying contention-chains framework used in
 * DistributedMutex is not abortable so we build abortability on the side.
 * All waiters wait on the central mutex state, by setting and resetting bits
 * within the pointer-length word.  Since pointer length atomic integers are
 * incompatible with futex(FUTEX_WAIT) on most systems, a non-standard
 * implementation of futex() is used, where wait queues are managed in
 * user-space (see p1135r0 and folly::ParkingLot for more)
 */
template <
    template <typename> class Atomic = std::atomic,
    bool TimePublishing = true>
class DistributedMutex {
 public:
  class DistributedMutexStateProxy;

  /**
   * DistributedMutex is only default constructible, it can neither be moved
   * nor copied
   */
  DistributedMutex();
  DistributedMutex(DistributedMutex&&) = delete;
  DistributedMutex(const DistributedMutex&) = delete;
  DistributedMutex& operator=(DistributedMutex&&) = delete;
  DistributedMutex& operator=(const DistributedMutex&) = delete;

  /**
   * Acquires the mutex in exclusive mode
   *
   * This returns an ephemeral proxy that contains internal mutex state.  This
   * must be kept around for the duration of the critical section and passed
   * subsequently to unlock() as an rvalue
   *
   * The proxy has no public API and is intended to be for internal usage only
   *
   * There are three notable cases where this method causes undefined
   * behavior:
   *
   *  - This is not a recursive mutex.  Trying to acquire the mutex twice from
   *    the same thread without unlocking it results in undefined behavior
   *  - Thread, coroutine or fiber migrations from within a critical section
   *    are disallowed.  This is because the implementation requires owning the
   *    stack frame through the execution of the critical section for both
   *    lock/unlock or combined critical sections.  This also means that you
   *    cannot allow another thread, fiber or coroutine to unlock the mutex
   *  - This mutex cannot be used in a program compiled with segmented stacks,
   *    there is currently no way to detect the presence of segmented stacks
   *    at compile time or runtime, so we have no checks against this
   */
  DistributedMutexStateProxy lock();

  /**
   * Unlocks the mutex
   *
   * The proxy returned by lock must be passed to unlock as an rvalue.  No
   * other option is possible here, since the proxy is only movable and not
   * copyable
   *
   * It is undefined behavior to unlock from a thread that did not lock the
   * mutex
   */
  void unlock(DistributedMutexStateProxy);

  /**
   * Try to acquire the mutex
   *
   * A non blocking version of the lock() function.  The returned object is
   * contextually convertible to bool.  And has the value true when the mutex
   * was successfully acquired, false otherwise
   *
   * This is allowed to return false spuriously, i.e. this is not guaranteed
   * to return true even when the mutex is currently unlocked.  In the event
   * of a failed acquisition, this does not impose any memory ordering
   * constraints for other threads
   */
  DistributedMutexStateProxy try_lock();

  /**
   * Try to acquire the mutex, blocking for the given time
   *
   * Like try_lock(), this is allowed to fail spuriously and is not guaranteed
   * to return false even when the mutex is currently unlocked.  But only
   * after the given time has elapsed
   *
   * try_lock_for() accepts a duration to block for, and try_lock_until()
   * accepts an absolute wall clock time point
   */
  template <typename Rep, typename Period>
  DistributedMutexStateProxy try_lock_for(
      const std::chrono::duration<Rep, Period>& duration);

  /**
   * Try to acquire the lock, blocking until the given deadline
   *
   * Other than the difference in the meaning of the second argument, the
   * semantics of this function are identical to try_lock_for()
   */
  template <typename Clock, typename Duration>
  DistributedMutexStateProxy try_lock_until(
      const std::chrono::time_point<Clock, Duration>& deadline);

  /**
   * Execute a task as a combined critical section
   *
   * Unlike traditional lock and unlock methods, lock_combine() enqueues the
   * passed task for execution on any arbitrary thread.  This allows the
   * implementation to prevent cache line invalidations originating from
   * expensive synchronization operations.  The thread holding the lock is
   * allowed to execute the task before unlocking, thereby forming a "combined
   * critical section".
   *
   * This idea is inspired by Flat Combining.  Flat Combining was introduced
   * in the SPAA 2010 paper titled "Flat Combining and the
   * Synchronization-Parallelism Tradeoff", by Danny Hendler, Itai Incze, Nir
   * Shavit, and Moran Tzafrir -
   * https://www.cs.bgu.ac.il/~hendlerd/papers/flat-combining.pdf.  The
   * implementation used here is significantly different from that described
   * in the paper.  The high-level goal of reducing the overhead of
   * synchronization, however, is the same.
   *
   * Combined critical sections work best when kept simple.  Since the
   * critical section might be executed on any arbitrary thread, relying on
   * things like thread local state or mutex locking and unlocking might cause
   * incorrectness.  Associativity is important.  For example
   *
   *    auto one = std::unique_lock{one_};
   *    two_.lock_combine([&]() {
   *      if (bar()) {
   *        one.unlock();
   *      }
   *    });
   *
   * This has the potential to cause undefined behavior because mutexes are
   * only meant to be acquired and released from the owning thread.  Similar
   * errors can arise from a combined critical section introducing implicit
   * dependencies based on the state of the combining thread.  For example
   *
   *    // thread 1
   *    auto one = std::unique_lock{one_};
   *    auto two = std::unique_lock{two_};
   *
   *    // thread 2
   *    two_.lock_combine([&]() {
   *      auto three = std::unique_lock{three_};
   *    });
   *
   * Here, because we used a combined critical section, we have introduced a
   * dependency from one -> three that might not obvious to the reader
   *
   * This function is exception-safe.  If the passed task throws an exception,
   * it will be propagated to the caller, even if the task is running on
   * another thread
   *
   * There are three notable cases where this method causes undefined
   * behavior:
   *
   *  - This is not a recursive mutex.  Trying to acquire the mutex twice from
   *    the same thread without unlocking it results in undefined behavior
   *  - Thread, coroutine or fiber migrations from within a critical section
   *    are disallowed.  This is because the implementation requires owning the
   *    stack frame through the execution of the critical section for both
   *    lock/unlock or combined critical sections.  This also means that you
   *    cannot allow another thread, fiber or coroutine to unlock the mutex
   *  - This mutex cannot be used in a program compiled with segmented stacks,
   *    there is currently no way to detect the presence of segmented stacks
   *    at compile time or runtime, so we have no checks against this
   */
  template <typename Task>
  auto lock_combine(Task task) -> folly::invoke_result_t<const Task&>;

  /**
   * Try to combine a task as a combined critical section untill the given time
   *
   * Like the other try_lock() mehtods, this is allowed to fail spuriously,
   * and is not guaranteed to return true even when the mutex is currently
   * unlocked.
   *
   * Note that this does not necessarily have the same performance
   * characteristics as the non-timed version of the combine method.  If
   * performance is critical, use that one instead
   */
  template <typename Rep, typename Period, typename Task>
  folly::Optional<invoke_result_t<Task&>> try_lock_combine_for(
      const std::chrono::duration<Rep, Period>& duration,
      Task task);

  /**
   * Try to combine a task as a combined critical section untill the given time
   *
   * Other than the difference in the meaning of the second argument, the
   * semantics of this function are identical to try_lock_combine_for()
   */
  template <typename Clock, typename Duration, typename Task>
  folly::Optional<invoke_result_t<Task&>> try_lock_combine_until(
      const std::chrono::time_point<Clock, Duration>& deadline,
      Task task);

 private:
  Atomic<std::uintptr_t> state_{0};
};

} // namespace distributed_mutex
} // namespace detail

/**
 * Bring the default instantiation of DistributedMutex into the folly
 * namespace without requiring any template arguments for public usage
 */
extern template class detail::distributed_mutex::DistributedMutex<>;
using DistributedMutex = detail::distributed_mutex::DistributedMutex<>;

} // namespace folly

#include <folly/synchronization/DistributedMutex-inl.h>
#include <folly/synchronization/DistributedMutexSpecializations.h>
