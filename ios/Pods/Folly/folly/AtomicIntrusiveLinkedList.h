/*
 * Copyright 2016 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <atomic>
#include <cassert>

namespace folly {

/**
 * A very simple atomic single-linked list primitive.
 *
 * Usage:
 *
 * class MyClass {
 *   AtomicIntrusiveLinkedListHook<MyClass> hook_;
 * }
 *
 * AtomicIntrusiveLinkedList<MyClass, &MyClass::hook_> list;
 * list.insert(&a);
 * list.sweep([] (MyClass* c) { doSomething(c); }
 */
template <class T>
struct AtomicIntrusiveLinkedListHook {
  T* next{nullptr};
};

template <class T, AtomicIntrusiveLinkedListHook<T> T::*HookMember>
class AtomicIntrusiveLinkedList {
 public:
  AtomicIntrusiveLinkedList() {}
  AtomicIntrusiveLinkedList(const AtomicIntrusiveLinkedList&) = delete;
  AtomicIntrusiveLinkedList& operator=(const AtomicIntrusiveLinkedList&) =
      delete;
  AtomicIntrusiveLinkedList(AtomicIntrusiveLinkedList&& other) noexcept {
    auto tmp = other.head_.load();
    other.head_ = head_.load();
    head_ = tmp;
  }
  AtomicIntrusiveLinkedList& operator=(
      AtomicIntrusiveLinkedList&& other) noexcept {
    auto tmp = other.head_.load();
    other.head_ = head_.load();
    head_ = tmp;

    return *this;
  }

  /**
   * Note: list must be empty on destruction.
   */
  ~AtomicIntrusiveLinkedList() {
    assert(empty());
  }

  bool empty() const {
    return head_.load() == nullptr;
  }

  /**
   * Atomically insert t at the head of the list.
   * @return True if the inserted element is the only one in the list
   *         after the call.
   */
  bool insertHead(T* t) {
    assert(next(t) == nullptr);

    auto oldHead = head_.load(std::memory_order_relaxed);
    do {
      next(t) = oldHead;
      /* oldHead is updated by the call below.

         NOTE: we don't use next(t) instead of oldHead directly due to
         compiler bugs (GCC prior to 4.8.3 (bug 60272), clang (bug 18899),
         MSVC (bug 819819); source:
         http://en.cppreference.com/w/cpp/atomic/atomic/compare_exchange */
    } while (!head_.compare_exchange_weak(oldHead, t,
                                          std::memory_order_release,
                                          std::memory_order_relaxed));

    return oldHead == nullptr;
  }

  /**
   * Repeatedly replaces the head with nullptr,
   * and calls func() on the removed elements in the order from tail to head.
   * Stops when the list is empty.
   */
  template <typename F>
  void sweep(F&& func) {
    while (auto head = head_.exchange(nullptr)) {
      auto rhead = reverse(head);
      while (rhead != nullptr) {
        auto t = rhead;
        rhead = next(t);
        next(t) = nullptr;
        func(t);
      }
    }
  }

 private:
  std::atomic<T*> head_{nullptr};

  static T*& next(T* t) {
    return (t->*HookMember).next;
  }

  /* Reverses a linked list, returning the pointer to the new head
     (old tail) */
  static T* reverse(T* head) {
    T* rhead = nullptr;
    while (head != nullptr) {
      auto t = head;
      head = next(t);
      next(t) = rhead;
      rhead = t;
    }
    return rhead;
  }
};

} // namespace folly
