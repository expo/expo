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

#include <folly/Portability.h>
#include <folly/synchronization/detail/Sleeper.h>

#include <glog/logging.h>

#include <atomic>
#include <thread>

/// Linked list class templates used in the hazard pointer library:
/// - linked_list: Sequential linked list that uses a pre-existing
///   members next() and set_next();.
/// - shared_head_tail_list: Thread-safe linked list that maintains
///   head and tail pointers. Supports push and pop_all.
/// - shared_head_only_list: Thread-safe linked lockable list that
///   maintains only a head pointer. Supports push and pop_all.

namespace folly {
namespace hazptr_detail {

/**
 *  linked_list
 *
 *  Template parameter Node must support set_next
 *
 */
template <typename Node>
class linked_list {
  Node* head_;
  Node* tail_;

 public:
  linked_list() noexcept : head_(nullptr), tail_(nullptr) {}

  explicit linked_list(Node* head, Node* tail) noexcept
      : head_(head), tail_(tail) {}

  Node* head() const noexcept {
    return head_;
  }

  Node* tail() const noexcept {
    return tail_;
  }

  bool empty() const noexcept {
    return head() == nullptr;
  }

  void push(Node* node) noexcept {
    node->set_next(nullptr);
    if (tail_) {
      tail_->set_next(node);
    } else {
      head_ = node;
    }
    tail_ = node;
  }

  void splice(linked_list& l) {
    if (head() == nullptr) {
      head_ = l.head();
    } else {
      tail_->set_next(l.head());
    }
    tail_ = l.tail();
    l.clear();
  }

  void clear() {
    head_ = nullptr;
    tail_ = nullptr;
  }

}; // linked_list

/**
 *  shared_head_tail_list
 *
 *  Maintains head and tail pointers. Supports push and pop all
 *  operations. Pop all operation is wait-free.
 */
template <typename Node, template <typename> class Atom = std::atomic>
class shared_head_tail_list {
  Atom<Node*> head_;
  Atom<Node*> tail_;

 public:
  shared_head_tail_list() noexcept : head_(nullptr), tail_(nullptr) {}

  shared_head_tail_list(shared_head_tail_list&& o) noexcept {
    head_.store(o.head(), std::memory_order_relaxed);
    tail_.store(o.tail(), std::memory_order_relaxed);
    o.head_.store(nullptr, std::memory_order_relaxed);
    o.tail_.store(nullptr, std::memory_order_relaxed);
  }

  shared_head_tail_list& operator=(shared_head_tail_list&& o) noexcept {
    head_.store(o.head(), std::memory_order_relaxed);
    tail_.store(o.tail(), std::memory_order_relaxed);
    o.head_.store(nullptr, std::memory_order_relaxed);
    o.tail_.store(nullptr, std::memory_order_relaxed);
    return *this;
  }

  ~shared_head_tail_list() {
    DCHECK(head() == nullptr);
    DCHECK(tail() == nullptr);
  }

  void push(Node* node) noexcept {
    bool done = false;
    while (!done) {
      if (tail()) {
        done = push_in_non_empty_list(node);
      } else {
        done = push_in_empty_list(node);
      }
    }
  }

  linked_list<Node> pop_all() noexcept {
    auto h = exchange_head();
    auto t = (h != nullptr) ? exchange_tail() : nullptr;
    return linked_list<Node>(h, t);
  }

  bool empty() const noexcept {
    return head() == nullptr;
  }

 private:
  Node* head() const noexcept {
    return head_.load(std::memory_order_acquire);
  }

  Node* tail() const noexcept {
    return tail_.load(std::memory_order_acquire);
  }

  void set_head(Node* node) noexcept {
    head_.store(node, std::memory_order_release);
  }

  bool cas_head(Node* expected, Node* node) noexcept {
    return head_.compare_exchange_weak(
        expected, node, std::memory_order_acq_rel, std::memory_order_relaxed);
  }

  bool cas_tail(Node* expected, Node* node) noexcept {
    return tail_.compare_exchange_weak(
        expected, node, std::memory_order_acq_rel, std::memory_order_relaxed);
  }

  Node* exchange_head() noexcept {
    return head_.exchange(nullptr, std::memory_order_acq_rel);
  }

  Node* exchange_tail() noexcept {
    return tail_.exchange(nullptr, std::memory_order_acq_rel);
  }

  bool push_in_non_empty_list(Node* node) noexcept {
    auto h = head();
    if (h) {
      node->set_next(h); // Node must support set_next
      if (cas_head(h, node)) {
        return true;
      }
    }
    return false;
  }

  bool push_in_empty_list(Node* node) noexcept {
    Node* t = nullptr;
    node->set_next(nullptr); // Node must support set_next
    if (cas_tail(t, node)) {
      set_head(node);
      return true;
    }
    return false;
  }
}; // shared_head_tail_list

/**
 *  shared_head_only_list
 *
 *  A shared singly linked list that maintains only a head pointer. It
 *  supports pop all and push list operations. Optionally the list may
 *  be locked for pop all operations. Pop all operations have locked
 *  and wait-free variants. Push operations are always lock-free.
 *
 *  Not all combinations of operationsa are mutually operable. The
 *  following are valid combinations:
 *  - push(kMayBeLocked), pop_all(kAlsoLock), push_unlock
 *  - push(kMayNotBeLocked), pop_all(kDontLock)
 *
 *  Locking is reentrant to prevent self deadlock.
 */
template <typename Node, template <typename> class Atom = std::atomic>
class shared_head_only_list {
  Atom<uintptr_t> head_{0}; // lowest bit is a lock for pop all
  Atom<std::thread::id> owner_{std::thread::id()};
  int reentrance_{0};

  static constexpr uintptr_t kLockBit = 1u;
  static constexpr uintptr_t kUnlocked = 0u;

 public:
  static constexpr bool kAlsoLock = true;
  static constexpr bool kDontLock = false;
  static constexpr bool kMayBeLocked = true;
  static constexpr bool kMayNotBeLocked = false;

 public:
  void push(linked_list<Node>& l, bool may_be_locked) noexcept {
    if (l.empty()) {
      return;
    }
    auto oldval = head();
    while (true) {
      auto newval = reinterpret_cast<uintptr_t>(l.head());
      auto ptrval = oldval;
      auto lockbit = oldval & kLockBit;
      if (may_be_locked == kMayBeLocked) {
        ptrval -= lockbit;
        newval += lockbit;
      } else {
        DCHECK_EQ(lockbit, kUnlocked);
      }
      auto ptr = reinterpret_cast<Node*>(ptrval);
      l.tail()->set_next(ptr); // Node must support set_next
      if (cas_head(oldval, newval)) {
        break;
      }
    }
  }

  Node* pop_all(bool lock) noexcept {
    return lock == kAlsoLock ? pop_all_lock() : pop_all_no_lock();
  }

  void push_unlock(linked_list<Node>& l) noexcept {
    DCHECK_EQ(owner(), std::this_thread::get_id());
    uintptr_t lockbit;
    if (reentrance_ > 0) {
      DCHECK_EQ(reentrance_, 1);
      --reentrance_;
      lockbit = kLockBit;
    } else {
      clear_owner();
      lockbit = kUnlocked;
    }
    DCHECK_EQ(reentrance_, 0);
    while (true) {
      auto oldval = head();
      DCHECK_EQ(oldval & kLockBit, kLockBit); // Should be already locked
      auto ptrval = oldval - kLockBit;
      auto ptr = reinterpret_cast<Node*>(ptrval);
      auto t = l.tail();
      if (t) {
        t->set_next(ptr); // Node must support set_next
      }
      auto newval =
          (t == nullptr) ? ptrval : reinterpret_cast<uintptr_t>(l.head());
      newval += lockbit;
      if (cas_head(oldval, newval)) {
        break;
      }
    }
  }

  bool check_lock() const noexcept {
    return (head() & kLockBit) == kLockBit;
  }

  bool empty() const noexcept {
    return head() == 0u;
  }

 private:
  uintptr_t head() const noexcept {
    return head_.load(std::memory_order_acquire);
  }

  uintptr_t exchange_head() noexcept {
    auto newval = reinterpret_cast<uintptr_t>(nullptr);
    auto oldval = head_.exchange(newval, std::memory_order_acq_rel);
    return oldval;
  }

  bool cas_head(uintptr_t& oldval, uintptr_t newval) noexcept {
    return head_.compare_exchange_weak(
        oldval, newval, std::memory_order_acq_rel, std::memory_order_acquire);
  }

  std::thread::id owner() {
    return owner_.load(std::memory_order_relaxed);
  }

  void set_owner() {
    DCHECK(owner() == std::thread::id());
    owner_.store(std::this_thread::get_id(), std::memory_order_relaxed);
  }

  void clear_owner() {
    owner_.store(std::thread::id(), std::memory_order_relaxed);
  }

  Node* pop_all_no_lock() noexcept {
    auto oldval = exchange_head();
    DCHECK_EQ(oldval & kLockBit, kUnlocked);
    return reinterpret_cast<Node*>(oldval);
  }

  Node* pop_all_lock() noexcept {
    folly::detail::Sleeper s;
    while (true) {
      auto oldval = head();
      auto lockbit = oldval & kLockBit;
      std::thread::id tid = std::this_thread::get_id();
      if (lockbit == kUnlocked || owner() == tid) {
        auto newval = reinterpret_cast<uintptr_t>(nullptr) + kLockBit;
        if (cas_head(oldval, newval)) {
          DCHECK_EQ(reentrance_, 0);
          if (lockbit == kUnlocked) {
            set_owner();
          } else {
            ++reentrance_;
          }
          auto ptrval = oldval - lockbit;
          return reinterpret_cast<Node*>(ptrval);
        }
      }
      s.sleep();
    }
  }
}; // shared_head_only_list

} // namespace hazptr_detail
} // namespace folly
