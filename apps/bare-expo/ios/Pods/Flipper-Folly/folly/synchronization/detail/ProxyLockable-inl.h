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
#include <folly/Portability.h>

#include <cassert>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <utility>

namespace folly {
namespace detail {
namespace proxylockable_detail {
template <typename Bool>
void throwIfAlreadyLocked(Bool&& locked) {
  if (kIsDebug && locked) {
    throw std::system_error{
        std::make_error_code(std::errc::resource_deadlock_would_occur)};
  }
}

template <typename Bool>
void throwIfNotLocked(Bool&& locked) {
  if (kIsDebug && !locked) {
    throw std::system_error{
        std::make_error_code(std::errc::operation_not_permitted)};
  }
}

template <typename Bool>
void throwIfNoMutex(Bool&& mutex) {
  if (kIsDebug && !mutex) {
    throw std::system_error{
        std::make_error_code(std::errc::operation_not_permitted)};
  }
}
} // namespace proxylockable_detail

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>::~ProxyLockableUniqueLock() {
  if (owns_lock()) {
    unlock();
  }
}

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>::ProxyLockableUniqueLock(
    mutex_type& mutex) noexcept {
  proxy_.emplace(mutex.lock());
  mutex_ = std::addressof(mutex);
}

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>::ProxyLockableUniqueLock(
    ProxyLockableUniqueLock&& a) noexcept {
  *this = std::move(a);
}

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>& ProxyLockableUniqueLock<Mutex>::operator=(
    ProxyLockableUniqueLock&& other) noexcept {
  proxy_ = std::move(other.proxy_);
  mutex_ = std::exchange(other.mutex_, nullptr);
  return *this;
}

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>::ProxyLockableUniqueLock(
    mutex_type& mutex,
    std::defer_lock_t) noexcept {
  mutex_ = std::addressof(mutex);
}

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>::ProxyLockableUniqueLock(
    mutex_type& mutex,
    std::try_to_lock_t) {
  mutex_ = std::addressof(mutex);
  if (auto state = mutex.try_lock()) {
    proxy_.emplace(std::move(state));
  }
}

template <typename Mutex>
template <typename Rep, typename Period>
ProxyLockableUniqueLock<Mutex>::ProxyLockableUniqueLock(
    mutex_type& mutex,
    const std::chrono::duration<Rep, Period>& duration) {
  mutex_ = std::addressof(mutex);
  if (auto state = mutex.try_lock_for(duration)) {
    proxy_.emplace(std::move(state));
  }
}

template <typename Mutex>
template <typename Clock, typename Duration>
ProxyLockableUniqueLock<Mutex>::ProxyLockableUniqueLock(
    mutex_type& mutex,
    const std::chrono::time_point<Clock, Duration>& time) {
  mutex_ = std::addressof(mutex);
  if (auto state = mutex.try_lock_until(time)) {
    proxy_.emplace(std::move(state));
  }
}

template <typename Mutex>
void ProxyLockableUniqueLock<Mutex>::lock() {
  proxylockable_detail::throwIfAlreadyLocked(proxy_);
  proxylockable_detail::throwIfNoMutex(mutex_);

  proxy_.emplace(mutex_->lock());
}

template <typename Mutex>
void ProxyLockableUniqueLock<Mutex>::unlock() {
  proxylockable_detail::throwIfNoMutex(mutex_);
  proxylockable_detail::throwIfNotLocked(proxy_);

  mutex_->unlock(std::move(*proxy_));
  proxy_.reset();
}

template <typename Mutex>
bool ProxyLockableUniqueLock<Mutex>::try_lock() {
  proxylockable_detail::throwIfNoMutex(mutex_);
  proxylockable_detail::throwIfAlreadyLocked(proxy_);

  if (auto state = mutex_->try_lock()) {
    proxy_.emplace(std::move(state));
    return true;
  }

  return false;
}

template <typename Mutex>
template <typename Rep, typename Period>
bool ProxyLockableUniqueLock<Mutex>::try_lock_for(
    const std::chrono::duration<Rep, Period>& duration) {
  proxylockable_detail::throwIfNoMutex(mutex_);
  proxylockable_detail::throwIfAlreadyLocked(proxy_);

  if (auto state = mutex_->try_lock_for(duration)) {
    proxy_.emplace(std::move(state));
    return true;
  }

  return false;
}

template <typename Mutex>
template <typename Clock, typename Duration>
bool ProxyLockableUniqueLock<Mutex>::try_lock_until(
    const std::chrono::time_point<Clock, Duration>& time) {
  proxylockable_detail::throwIfNoMutex(mutex_);
  proxylockable_detail::throwIfAlreadyLocked(proxy_);

  if (auto state = mutex_->try_lock_until(time)) {
    proxy_.emplace(std::move(state));
    return true;
  }

  return false;
}

template <typename Mutex>
void ProxyLockableUniqueLock<Mutex>::swap(
    ProxyLockableUniqueLock& other) noexcept {
  std::swap(mutex_, other.mutex_);
  std::swap(proxy_, other.proxy_);
}

template <typename Mutex>
typename ProxyLockableUniqueLock<Mutex>::mutex_type*
ProxyLockableUniqueLock<Mutex>::mutex() const noexcept {
  return mutex_;
}

template <typename Mutex>
typename ProxyLockableUniqueLock<Mutex>::proxy_type*
ProxyLockableUniqueLock<Mutex>::proxy() const noexcept {
  return proxy_ ? std::addressof(proxy_.value()) : nullptr;
}

template <typename Mutex>
bool ProxyLockableUniqueLock<Mutex>::owns_lock() const noexcept {
  return proxy_.has_value();
}

template <typename Mutex>
ProxyLockableUniqueLock<Mutex>::operator bool() const noexcept {
  return owns_lock();
}

template <typename Mutex>
ProxyLockableLockGuard<Mutex>::ProxyLockableLockGuard(mutex_type& mutex)
    : ProxyLockableUniqueLock<Mutex>{mutex} {}

} // namespace detail
} // namespace folly
