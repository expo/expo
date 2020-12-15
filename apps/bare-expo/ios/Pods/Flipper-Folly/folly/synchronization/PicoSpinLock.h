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

/*
 * N.B. You most likely do _not_ want to use PicoSpinLock or any other
 * kind of spinlock.  Consider MicroLock instead.
 *
 * In short, spinlocks in preemptive multi-tasking operating systems
 * have serious problems and fast mutexes like std::mutex are almost
 * certainly the better choice, because letting the OS scheduler put a
 * thread to sleep is better for system responsiveness and throughput
 * than wasting a timeslice repeatedly querying a lock held by a
 * thread that's blocked, and you can't prevent userspace
 * programs blocking.
 *
 * Spinlocks in an operating system kernel make much more sense than
 * they do in userspace.
 */

#pragma once
#define FOLLY_PICO_SPIN_LOCK_H_

/*
 * @author Keith Adams <kma@fb.com>
 * @author Jordan DeLong <delong.j@fb.com>
 */

#include <array>
#include <atomic>
#include <cinttypes>
#include <cstdlib>
#include <mutex>
#include <type_traits>

#include <glog/logging.h>

#include <folly/Portability.h>
#include <folly/synchronization/AtomicUtil.h>
#include <folly/synchronization/SanitizeThread.h>
#include <folly/synchronization/detail/Sleeper.h>

namespace folly {

/*
 * Spin lock on a single bit in an integral type.  You can use this
 * with 16, 32, or 64-bit integral types.
 *
 * This is useful if you want a small lock and already have an int
 * with a bit in it that you aren't using.  But note that it can't be
 * as small as MicroSpinLock (1 byte), if you don't already have a
 * convenient int with an unused bit lying around to put it on.
 *
 * To construct these, either use init() or zero initialize.  We don't
 * have a real constructor because we want this to be a POD type so we
 * can put it into packed structs.
 */
template <class IntType, int Bit = sizeof(IntType) * 8 - 1>
struct PicoSpinLock {
  // Internally we deal with the unsigned version of the type.
  typedef typename std::make_unsigned<IntType>::type UIntType;

  static_assert(
      std::is_integral<IntType>::value,
      "PicoSpinLock needs an integral type");
  static_assert(
      sizeof(IntType) == 2 || sizeof(IntType) == 4 || sizeof(IntType) == 8,
      "PicoSpinLock can't work on integers smaller than 2 bytes");

 public:
  static const UIntType kLockBitMask_ = UIntType(1) << Bit;
  mutable UIntType lock_;

  /*
   * You must call this function before using this class, if you
   * default constructed it.  If you zero-initialized it you can
   * assume the PicoSpinLock is in a valid unlocked state with
   * getData() == 0.
   *
   * (This doesn't use a constructor because we want to be a POD.)
   */
  void init(IntType initialValue = 0) {
    CHECK(!(initialValue & kLockBitMask_));
    reinterpret_cast<std::atomic<UIntType>*>(&lock_)->store(
        UIntType(initialValue), std::memory_order_release);
  }

  /*
   * Returns the value of the integer we using for our lock, except
   * with the bit we are using as a lock cleared, regardless of
   * whether the lock is held.
   *
   * It is 'safe' to call this without holding the lock.  (As in: you
   * get the same guarantees for simultaneous accesses to an integer
   * as you normally get.)
   */
  IntType getData() const {
    auto res = reinterpret_cast<std::atomic<UIntType>*>(&lock_)->load(
                   std::memory_order_relaxed) &
        ~kLockBitMask_;
    return res;
  }

  /*
   * Set the value of the other bits in our integer.
   *
   * Don't use this when you aren't holding the lock, unless it can be
   * guaranteed that no other threads may be trying to use this.
   */
  void setData(IntType w) {
    CHECK(!(w & kLockBitMask_));
    auto l = reinterpret_cast<std::atomic<UIntType>*>(&lock_);
    l->store(
        (l->load(std::memory_order_relaxed) & kLockBitMask_) | w,
        std::memory_order_relaxed);
  }

  /*
   * Try to get the lock without blocking: returns whether or not we
   * got it.
   */
  bool try_lock() const {
    auto ret = try_lock_internal();
    annotate_rwlock_try_acquired(
        this, annotate_rwlock_level::wrlock, ret, __FILE__, __LINE__);
    return ret;
  }

  /*
   * Block until we can acquire the lock.  Uses Sleeper to wait.
   */
  void lock() const {
    detail::Sleeper sleeper;
    while (!try_lock_internal()) {
      sleeper.wait();
    }
    annotate_rwlock_acquired(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
  }

  /*
   * Release the lock, without changing the value of the rest of the
   * integer.
   */
  void unlock() const {
    annotate_rwlock_released(
        this, annotate_rwlock_level::wrlock, __FILE__, __LINE__);
    auto previous = atomic_fetch_reset(
        *reinterpret_cast<std::atomic<UIntType>*>(&lock_),
        Bit,
        std::memory_order_release);
    DCHECK(previous);
  }

 private:
  // called by lock/try_lock - this is not TSAN aware
  bool try_lock_internal() const {
    auto previous = atomic_fetch_set(
        *reinterpret_cast<std::atomic<UIntType>*>(&lock_),
        Bit,
        std::memory_order_acquire);
    return !previous;
  }
};

} // namespace folly
