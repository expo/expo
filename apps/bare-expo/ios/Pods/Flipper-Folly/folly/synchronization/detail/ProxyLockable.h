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

#include <mutex>

namespace folly {
namespace detail {

/**
 * ProxyLockable is a "concept" that is used usually for mutexes that don't
 * return void, but rather a proxy object that contains data that should be
 * passed to the unlock function.
 *
 * This is in contrast with the normal Lockable concept that imposes no
 * requirement on the return type of lock(), and requires an unlock() with no
 * parameters.  Here we require that lock() returns non-void and that unlock()
 * accepts the return type of lock() by value, rvalue-reference or
 * const-reference
 *
 * Here we define two classes, that can be used by the top level to implement
 * specializations for std::unique_lock and std::lock_guard.  Both
 * ProxyLockableUniqueLock and ProxyLockableLockGuard implement the entire
 * interface of std::unique_lock and std::lock_guard respectively
 */
template <typename Mutex>
class ProxyLockableUniqueLock {
 public:
  using mutex_type = Mutex;
  using proxy_type = std::decay_t<decltype(std::declval<mutex_type>().lock())>;

  /**
   * Default constructor initializes the unique_lock to an empty state
   */
  ProxyLockableUniqueLock() = default;

  /**
   * Destructor releases the mutex if it is locked
   */
  ~ProxyLockableUniqueLock();

  /**
   * Move constructor and move assignment operators take state from the other
   * lock
   */
  ProxyLockableUniqueLock(ProxyLockableUniqueLock&& other) noexcept;
  ProxyLockableUniqueLock& operator=(ProxyLockableUniqueLock&&) noexcept;

  /**
   * Locks the mutex, blocks until the mutex can be acquired.
   *
   * The mutex is guaranteed to be acquired after this function returns.
   */
  ProxyLockableUniqueLock(mutex_type&) noexcept;

  /**
   * Explicit locking constructors to control how the lock() method is called
   *
   * std::defer_lock_t causes the mutex to get tracked, but not locked
   * std::try_to_lock_t causes try_lock() to be called.  The current object is
   *                    converts to true if the lock was successful
   */
  ProxyLockableUniqueLock(mutex_type& mutex, std::defer_lock_t) noexcept;
  ProxyLockableUniqueLock(mutex_type& mutex, std::try_to_lock_t);

  /**
   * Timed locking constructors
   */
  template <typename Rep, typename Period>
  ProxyLockableUniqueLock(
      mutex_type& mutex,
      const std::chrono::duration<Rep, Period>& duration);
  template <typename Clock, typename Duration>
  ProxyLockableUniqueLock(
      mutex_type& mutex,
      const std::chrono::time_point<Clock, Duration>& time);

  /**
   * Lock and unlock methods
   *
   * lock() and try_lock() throw if the mutex is already locked, or there is
   * no mutex.  unlock() throws if there is no mutex or if the mutex was not
   * locked
   */
  void lock();
  void unlock();
  bool try_lock();

  /**
   * Timed locking methods
   *
   * These throw if there was no mutex, or if the mutex was already locked
   */
  template <typename Rep, typename Period>
  bool try_lock_for(const std::chrono::duration<Rep, Period>& duration);
  template <typename Clock, typename Duration>
  bool try_lock_until(const std::chrono::time_point<Clock, Duration>& time);

  /**
   * Swap this unique lock with the other one
   */
  void swap(ProxyLockableUniqueLock& other) noexcept;

  /**
   * Returns true if the unique lock contains a lock and also has acquired an
   * exclusive lock successfully
   */
  bool owns_lock() const noexcept;
  explicit operator bool() const noexcept;

  /**
   * mutex() return a pointer to the mutex if there is a contained mutex and
   * proxy() returns a pointer to the contained proxy if the mutex is locked
   *
   * If the unique lock was not constructed with a mutex, then mutex() returns
   * nullptr.  If the mutex is not locked, then proxy() returns nullptr
   */
  mutex_type* mutex() const noexcept;
  proxy_type* proxy() const noexcept;

 private:
  friend class ProxyLockableTest;

  /**
   * If the optional has a value, the mutex is locked, if it is empty, it is
   * not
   */
  mutable folly::Optional<proxy_type> proxy_{};
  mutex_type* mutex_{nullptr};
};

template <typename Mutex>
class ProxyLockableLockGuard : private ProxyLockableUniqueLock<Mutex> {
 public:
  using mutex_type = Mutex;

  /**
   * Constructor locks the mutex, and destructor unlocks
   */
  ProxyLockableLockGuard(mutex_type& mutex);
  ~ProxyLockableLockGuard() = default;

  /**
   * This class is not movable or assignable
   *
   * For more complicated usecases, consider the UniqueLock variant, which
   * provides more options
   */
  ProxyLockableLockGuard(const ProxyLockableLockGuard&) = delete;
  ProxyLockableLockGuard(ProxyLockableLockGuard&&) = delete;
  ProxyLockableLockGuard& operator=(ProxyLockableLockGuard&&) = delete;
  ProxyLockableLockGuard& operator=(const ProxyLockableLockGuard&) = delete;
};

} // namespace detail
} // namespace folly

#include <folly/synchronization/detail/ProxyLockable-inl.h>
