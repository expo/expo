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
#include <cstdint>
#include <memory>
#include <mutex>

#include <folly/Indestructible.h>
#include <folly/experimental/ReadMostlySharedPtr.h>
#include <folly/synchronization/Rcu.h>

namespace folly {

namespace detail {
struct AtomicReadMostlyTag;
extern Indestructible<std::mutex> atomicReadMostlyMu;
extern Indestructible<rcu_domain<AtomicReadMostlyTag>> atomicReadMostlyDomain;
} // namespace detail

/*
 * What atomic_shared_ptr is to shared_ptr, AtomicReadMostlyMainPtr is to
 * ReadMostlyMainPtr; it allows racy conflicting accesses to one. This gives
 * true shared_ptr-like semantics, including reclamation at the point where the
 * last pointer to an object goes away.
 *
 * It's about the same speed (slightly slower) as ReadMostlyMainPtr. The most
 * significant feature they share is avoiding reader-reader contention and
 * atomic RMWs in the absence of writes.
 */
template <typename T>
class AtomicReadMostlyMainPtr {
 public:
  AtomicReadMostlyMainPtr() : curMainPtrIndex_(0) {}

  explicit AtomicReadMostlyMainPtr(std::shared_ptr<T> ptr)
      : curMainPtrIndex_(0) {
    mainPtrs_[0] = ReadMostlyMainPtr<T>{std::move(ptr)};
  }

  void operator=(std::shared_ptr<T> desired) {
    store(std::move(desired));
  }

  bool is_lock_free() const {
    return false;
  }

  ReadMostlySharedPtr<T> load(
      std::memory_order order = std::memory_order_seq_cst) const {
    auto token = detail::atomicReadMostlyDomain->lock_shared();
    // Synchronization point with the store in storeLocked().
    auto index = curMainPtrIndex_.load(order);
    auto result = mainPtrs_[index].getShared();
    detail::atomicReadMostlyDomain->unlock_shared(std::move(token));
    return result;
  }

  void store(
      std::shared_ptr<T> ptr,
      std::memory_order order = std::memory_order_seq_cst) {
    std::shared_ptr<T> old;
    {
      std::lock_guard<std::mutex> lg(*detail::atomicReadMostlyMu);
      old = exchangeLocked(std::move(ptr), order);
    }
    // If ~T() runs (triggered by the shared_ptr refcount decrement), it's here,
    // after dropping the lock. This avoids a possible (albeit esoteric)
    // deadlock if ~T() modifies the AtomicReadMostlyMainPtr that used to point
    // to it.
  }

  std::shared_ptr<T> exchange(
      std::shared_ptr<T> ptr,
      std::memory_order order = std::memory_order_seq_cst) {
    std::lock_guard<std::mutex> lg(*detail::atomicReadMostlyMu);
    return exchangeLocked(std::move(ptr), order);
  }

  bool compare_exchange_weak(
      std::shared_ptr<T>& expected,
      const std::shared_ptr<T>& desired,
      std::memory_order successOrder = std::memory_order_seq_cst,
      std::memory_order failureOrder = std::memory_order_seq_cst) {
    return compare_exchange_strong(
        expected, desired, successOrder, failureOrder);
  }

  bool compare_exchange_strong(
      std::shared_ptr<T>& expected,
      const std::shared_ptr<T>& desired,
      std::memory_order successOrder = std::memory_order_seq_cst,
      std::memory_order failureOrder = std::memory_order_seq_cst) {
    // See the note at the end of store; we need to defer any destruction we
    // might trigger until after the lock is released.
    // This is not actually needed down the success path (the reference passed
    // in as expected is another pointer to the same object, so we won't
    // decrement the refcount to 0), but "never decrement a refcount while
    // holding a lock" is an easier rule to keep in our heads, and costs us
    // nothing.
    std::shared_ptr<T> prev;
    std::shared_ptr<T> expectedDup;
    {
      std::lock_guard<std::mutex> lg(*detail::atomicReadMostlyMu);
      auto index = curMainPtrIndex_.load(failureOrder);
      ReadMostlyMainPtr<T>& oldMain = mainPtrs_[index];
      if (oldMain.get() != expected.get()) {
        expectedDup = std::move(expected);
        expected = oldMain.getStdShared();
        return false;
      }
      prev = exchangeLocked(desired, successOrder);
    }
    return true;
  }

 private:
  // Must hold the global mutex.
  std::shared_ptr<T> exchangeLocked(
      std::shared_ptr<T> ptr,
      std::memory_order order = std::memory_order_seq_cst) {
    // This is where the tricky bits happen; all modifications of the mainPtrs_
    // and index happen here. We maintain the invariant that, on entry to this
    // method, all read-side critical sections in progress are using the version
    // indicated by curMainPtrIndex_, and the other version is nulled out.
    // (Readers can still hold a ReadMostlySharedPtr to the thing the old
    // version used to point to; they just can't access the old version to get
    // that handle any more).
    auto index = curMainPtrIndex_.load(std::memory_order_relaxed);
    ReadMostlyMainPtr<T>& oldMain = mainPtrs_[index];
    ReadMostlyMainPtr<T>& newMain = mainPtrs_[1 - index];
    DCHECK(newMain.get() == nullptr)
        << "Invariant should ensure that at most one version is non-null";
    newMain.reset(std::move(ptr));
    // If order is acq_rel, it should degrade to just release, since this is a
    // store rather than an RMW. (Of course, this is such a slow method that we
    // don't really care, but precision is its own reward. If TSAN one day
    // understands asymmetric barriers, this will also improve its error
    // detection here). We get our "acquire-y-ness" from the mutex.
    auto realOrder =
        (order == std::memory_order_acq_rel ? std::memory_order_release
                                            : order);
    // After this, read-side critical sections can access both versions, but
    // new ones will use newMain.
    // This is also synchronization point with loads.
    curMainPtrIndex_.store(1 - index, realOrder);
    // Wait for all read-side critical sections using oldMain to finish.
    detail::atomicReadMostlyDomain->synchronize();
    // We've reestablished the first half of the invariant (all readers are
    // using newMain), now let's establish the other one (that the other pointer
    // is null).
    auto result = oldMain.getStdShared();
    oldMain.reset();
    return result;
  }

  // The right way to think of this implementation is as an
  // std::atomic<ReadMostlyMainPtr<T>*>, protected by RCU. There's only two
  // tricky parts:
  // 1. We give ourselves our own RCU domain, and synchronize on modification,
  //    so that we don't do any batching of deallocations. This gives
  //    shared_ptr-like eager reclamation semantics.
  // 2. Instead of putting the ReadMostlyMainPtrs on the heap, we keep them as
  //    part of the same object to improve locality.

  // Really, just a 0/1 index. This is also the synchronization point for memory
  // orders.
  std::atomic<uint8_t> curMainPtrIndex_;

  // Both the ReadMostlyMainPtrs themselves and the domain have nontrivial
  // indirections even on the read path, and asymmetric barriers on the write
  // path. Some of these could be fused as a later optimization, at the cost of
  // having to put more tricky threading primitives in this class that are
  // currently abstracted out by those.
  ReadMostlyMainPtr<T> mainPtrs_[2];
};

} // namespace folly
