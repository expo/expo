// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

#include <folly/Synchronized.h>
#include <atomic>

namespace yarpl {

template <typename T>
struct AtomicReference {
  folly::Synchronized<std::shared_ptr<T>, std::mutex> ref;

  AtomicReference() = default;

  AtomicReference(std::shared_ptr<T>&& r) {
    *(ref.lock()) = std::move(r);
  }
};

template <typename T>
std::shared_ptr<T> atomic_load(AtomicReference<T>* ar) {
  return *(ar->ref.lock());
}

template <typename T>
std::shared_ptr<T> atomic_exchange(
    AtomicReference<T>* ar,
    std::shared_ptr<T> r) {
  auto refptr = ar->ref.lock();
  auto old = std::move(*refptr);
  *refptr = std::move(r);
  return old;
}

template <typename T>
std::shared_ptr<T> atomic_exchange(AtomicReference<T>* ar, std::nullptr_t) {
  return atomic_exchange(ar, std::shared_ptr<T>());
}

template <typename T>
void atomic_store(AtomicReference<T>* ar, std::shared_ptr<T> r) {
  *ar->ref.lock() = std::move(r);
}

class enable_get_ref : public std::enable_shared_from_this<enable_get_ref> {
 private:
  virtual void dummy_internal_get_ref() {}

 protected:
  // materialize a reference to 'this', but a type even further derived from
  // Derived, because C++ doesn't have covariant return types on methods
  template <typename As>
  std::shared_ptr<As> ref_from_this(As* ptr) {
    // at runtime, ensure that the most derived class can indeed be
    // converted into an 'as'
    (void)ptr; // silence 'unused parameter' errors in Release builds
    return std::static_pointer_cast<As>(this->shared_from_this());
  }

  template <typename As>
  std::shared_ptr<As> ref_from_this(As const* ptr) const {
    // at runtime, ensure that the most derived class can indeed be
    // converted into an 'as'
    (void)ptr; // silence 'unused parameter' errors in Release builds
    return std::static_pointer_cast<As const>(this->shared_from_this());
  }

 public:
  virtual ~enable_get_ref() = default;
};

} /* namespace yarpl */
