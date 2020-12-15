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

#include <memory>

#include <folly/synchronization/Baton.h>

#include <glog/logging.h>

namespace folly {

template <typename T>
class MasterPtrRef;

/**
 * MasterPtr should be used to achieve deterministic destruction of objects with
 * shared ownership.
 * Once an object is managed by a MasterPtr, shared_ptrs can be obtained
 * pointing to that object. However destroying those shared_ptrs will never call
 * the object destructor inline. To destroy the object, join() method should be
 * called on MasterPtr which will wait for all shared_ptrs to be released and
 * then call the object destructor inline.
 */
template <typename T>
class MasterPtr {
 public:
  MasterPtr();
  MasterPtr(std::unique_ptr<T> ptr) {
    set(std::move(ptr));
  }
  ~MasterPtr() {
    if (innerPtr_) {
      LOG(FATAL) << "MasterPtr has to be joined explicitly.";
    }
  }

  // Attempts to lock a pointer. Returns null if pointer is not set or if join()
  // was called (even if the call to join() hasn't returned yet).
  std::shared_ptr<T> lock() const {
    if (auto outerPtr = outerPtrWeak_.lock()) {
      return *outerPtr;
    }
    return nullptr;
  }

  // Waits until all the refereces obtained via lock() are released. Then
  // destroys the object in the current thread.
  // Can not be called concurrently with set().
  void join() {
    if (!innerPtr_) {
      return;
    }

    outerPtrShared_.reset();
    joinBaton_.wait();
    innerPtr_.reset();
  }

  // Sets the pointer. Can not be called concurrently with lock() or join() or
  // ref().
  void set(std::unique_ptr<T> ptr) {
    if (innerPtr_) {
      LOG(FATAL) << "MasterPtr has to be joined before being set.";
    }

    if (!ptr) {
      return;
    }

    innerPtr_ = std::move(ptr);
    joinBaton_.reset();
    auto innerPtrShared =
        std::shared_ptr<T>(innerPtr_.get(), [&](T*) { joinBaton_.post(); });
    outerPtrShared_ =
        std::make_shared<std::shared_ptr<T>>(std::move(innerPtrShared));
    outerPtrWeak_ = outerPtrShared_;
  }

  // Gets a non-owning reference to the pointer. join() does *NOT* wait for
  // outstanding MasterPtrRef objects to be released.
  MasterPtrRef<T> ref() const {
    return MasterPtrRef<T>(outerPtrWeak_);
  }

 private:
  friend class MasterPtrRef<T>;
  folly::Baton<> joinBaton_;
  std::shared_ptr<std::shared_ptr<T>> outerPtrShared_;
  std::weak_ptr<std::shared_ptr<T>> outerPtrWeak_;
  std::unique_ptr<T> innerPtr_;
};

template <typename T>
class MasterPtrRef {
 public:
  // Attempts to lock a pointer. Returns null if pointer is not set or if join()
  // was called (even if the call to join() hasn't returned yet).
  std::shared_ptr<T> lock() const {
    if (auto outerPtr = outerPtrWeak_.lock()) {
      return *outerPtr;
    }
    return nullptr;
  }

 private:
  friend class MasterPtr<T>;
  /* implicit */ MasterPtrRef(std::weak_ptr<std::shared_ptr<T>> outerPtrWeak)
      : outerPtrWeak_(std::move(outerPtrWeak)) {}

  std::weak_ptr<std::shared_ptr<T>> outerPtrWeak_;
};

} // namespace folly
