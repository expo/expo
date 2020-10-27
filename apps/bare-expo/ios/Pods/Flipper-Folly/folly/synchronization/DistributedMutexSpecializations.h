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

#include <folly/synchronization/DistributedMutex.h>
#include <folly/synchronization/detail/ProxyLockable.h>

/**
 * Specializations for DistributedMutex allow us to use it like a normal
 * mutex.  Even though it has a non-usual interface
 */
namespace std {
template <template <typename> class Atom, bool TimePublishing>
class unique_lock<
    ::folly::detail::distributed_mutex::DistributedMutex<Atom, TimePublishing>>
    : public ::folly::detail::ProxyLockableUniqueLock<
          ::folly::detail::distributed_mutex::
              DistributedMutex<Atom, TimePublishing>> {
 public:
  using ::folly::detail::ProxyLockableUniqueLock<
      ::folly::detail::distributed_mutex::
          DistributedMutex<Atom, TimePublishing>>::ProxyLockableUniqueLock;
};

template <template <typename> class Atom, bool TimePublishing>
class lock_guard<
    ::folly::detail::distributed_mutex::DistributedMutex<Atom, TimePublishing>>
    : public ::folly::detail::ProxyLockableLockGuard<
          ::folly::detail::distributed_mutex::
              DistributedMutex<Atom, TimePublishing>> {
 public:
  using ::folly::detail::ProxyLockableLockGuard<
      ::folly::detail::distributed_mutex::
          DistributedMutex<Atom, TimePublishing>>::ProxyLockableLockGuard;
};
} // namespace std
