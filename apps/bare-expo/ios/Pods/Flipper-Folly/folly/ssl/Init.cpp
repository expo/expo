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

#include <folly/ssl/Init.h>

#include <mutex>

#include <folly/portability/OpenSSL.h>
#include <folly/ssl/detail/OpenSSLThreading.h>
#include <glog/logging.h>

namespace folly {
namespace ssl {

namespace {
bool initialized_ = false;

std::mutex& initMutex() {
  static std::mutex m;
  return m;
}

void initializeOpenSSLLocked() {
  if (initialized_) {
    return;
  }
  if (OPENSSL_init_ssl(0, nullptr) != 1) {
    // Fail early if we fail to initialize OpenSSL. Ignoring this means that
    // future OpenSSL methods may segfault, since there is an implicit
    // precondition that initialization properly initializes internal OpenSSL
    // pointers to global resources.
    throw std::runtime_error("Failed to initialize OpenSSL.");
  }

  // OpenSSL implicitly seeds its RNG since 1.1.0, so this call is unnecessary
  // and is only here for compatibility with older versions of OpenSSL.
#if !(FOLLY_OPENSSL_IS_110)
  if (RAND_poll() != 1) {
    // Similarly, if we fail to seed the RNG, future crypto operations
    // may no longer be safe to use; fail fast and hard here.
    throw std::runtime_error("Failed to initialize OpenSSL RNG.");
  }
#endif
  initialized_ = true;
}

void cleanupOpenSSLLocked() {
  if (!initialized_) {
    return;
  }

  OPENSSL_cleanup();
  initialized_ = false;
}
} // namespace

void init() {
  std::lock_guard<std::mutex> g(initMutex());
  initializeOpenSSLLocked();
}

void cleanup() {
  std::lock_guard<std::mutex> g(initMutex());
  cleanupOpenSSLLocked();
}

void markInitialized() {
  std::lock_guard<std::mutex> g(initMutex());
  initialized_ = true;
}

void setLockTypesAndInit(LockTypeMapping inLockTypes) {
  std::lock_guard<std::mutex> g(initMutex());
  CHECK(!initialized_) << "OpenSSL is already initialized";
  detail::setLockTypes(std::move(inLockTypes));
  initializeOpenSSLLocked();
}

void setLockTypes(LockTypeMapping inLockTypes) {
  std::lock_guard<std::mutex> g(initMutex());
  if (initialized_) {
    // We set the locks on initialization, so if we are already initialized
    // this would have no affect.
    LOG(INFO) << "Ignoring setSSLLockTypes after initialization";
    return;
  }
  detail::setLockTypes(std::move(inLockTypes));
}

bool isLockDisabled(int lockId) {
  return detail::isSSLLockDisabled(lockId);
}

} // namespace ssl
} // namespace folly
