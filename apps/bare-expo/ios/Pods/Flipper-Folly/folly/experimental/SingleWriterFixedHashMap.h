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

#include <folly/lang/Bits.h>
#include <glog/logging.h>

#include <atomic>

namespace folly {

/// SingleWriterFixedHashMap:
///
/// Minimal single-writer fixed hash map implementation that supports:
/// - Copy construction with optional capacity expansion.
/// - Concurrent read-only lookup.
/// - Concurrent read-only iteration.
///
/// Assumes that higher level code:
/// - Checks availability of empty slots before calling insert
/// - Manages expansion and/or cleanup of tombstones
///
/// Notes on algorithm:
/// - Tombstones are used to mark previously occupied slots.
/// - A slot with a tombstone can only be reused for the same key. The
///   reason for that is to enforce that once a key occupies a slot,
///   that key cannot use any other slot for the lifetime of the
///   map. This is to guarantee that when readers iterate over the map
///   they do not encounter any key more than once.
///
/// Writer-only operations:
/// - insert()
/// - erase()
/// - used()
/// - available()
///
template <typename Key, typename Value>
class SingleWriterFixedHashMap {
#if __cpp_lib_atomic_is_always_lock_free
  static_assert(
      std::atomic<Value>::is_always_lock_free,
      "This implementation depends on having fast atomic "
      "data-race-free loads and stores of Value type.");
#endif
  static_assert(
      std::is_trivial<Key>::value,
      "This implementation depends on using a single key instance "
      "for all insert and erase operations. The reason is to allow "
      "readers to read keys data-race-free concurrently with possible "
      "concurrent insert and erase operations on the keys.");

  class Elem;

  enum class State : uint8_t { EMPTY, VALID, TOMBSTONE };

  size_t capacity_;
  size_t used_{0};
  std::atomic<size_t> size_{0};
  std::unique_ptr<Elem[]> elem_;

 public:
  class Iterator;

  explicit SingleWriterFixedHashMap(size_t capacity)
      : capacity_(folly::nextPowTwo(capacity)) {}

  explicit SingleWriterFixedHashMap(
      size_t capacity,
      const SingleWriterFixedHashMap& o)
      : capacity_(folly::nextPowTwo(capacity)) {
    if (o.empty()) {
      return;
    }
    elem_ = std::make_unique<Elem[]>(capacity_);
    for (size_t i = 0; i < o.capacity_; ++i) {
      Elem& e = o.elem_[i];
      if (e.valid()) {
        insert(e.key(), e.value());
      }
    }
  }

  FOLLY_ALWAYS_INLINE Iterator begin() const {
    return empty() ? end() : Iterator(*this);
  }

  FOLLY_ALWAYS_INLINE Iterator end() const {
    return Iterator(*this, capacity_);
  }

  size_t capacity() const {
    return capacity_;
  }

  /* not data-race-free, to be called only by the single writer */
  size_t used() const {
    return used_;
  }

  /* not-data race-free, to be called only by the single writer */
  size_t available() const {
    return capacity_ - used_;
  }

  /* data-race-free, can be called by readers */
  FOLLY_ALWAYS_INLINE size_t size() const {
    return size_.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE bool empty() const {
    return size() == 0;
  }

  bool insert(Key key, Value value) {
    if (!elem_) {
      elem_ = std::make_unique<Elem[]>(capacity_);
    }
    DCHECK_LT(used_, capacity_);
    if (writer_find(key) < capacity_) {
      return false;
    }
    size_t index = hash(key);
    auto attempts = capacity_;
    size_t mask = capacity_ - 1;
    while (attempts--) {
      Elem& e = elem_[index];
      auto state = e.state();
      if (state == State::EMPTY ||
          (state == State::TOMBSTONE && e.key() == key)) {
        if (state == State::EMPTY) {
          e.setKey(key);
          ++used_;
          DCHECK_LE(used_, capacity_);
        }
        e.setValue(value);
        e.setValid();
        setSize(size() + 1);
        DCHECK_LE(size(), used_);
        return true;
      }
      index = (index + 1) & mask;
    }
    CHECK(false) << "No available slots";
    folly::assume_unreachable();
  }

  void erase(Iterator& it) {
    DCHECK_NE(it, end());
    Elem& e = elem_[it.index_];
    erase_internal(e);
  }

  bool erase(Key key) {
    size_t index = writer_find(key);
    if (index == capacity_) {
      return false;
    }
    Elem& e = elem_[index];
    erase_internal(e);
    return true;
  }

  FOLLY_ALWAYS_INLINE Iterator find(Key key) const {
    size_t index = reader_find(key);
    return Iterator(*this, index);
  }

  FOLLY_ALWAYS_INLINE bool contains(Key key) const {
    return reader_find(key) < capacity_;
  }

 private:
  FOLLY_ALWAYS_INLINE size_t hash(Key key) const {
    size_t mask = capacity_ - 1;
    size_t index = std::hash<Key>()(key) & mask;
    DCHECK_LT(index, capacity_);
    return index;
  }

  void setSize(size_t size) {
    size_.store(size, std::memory_order_release);
  }

  FOLLY_ALWAYS_INLINE size_t reader_find(Key key) const {
    return find_internal(key);
  }

  size_t writer_find(Key key) {
    return find_internal(key);
  }

  FOLLY_ALWAYS_INLINE size_t find_internal(Key key) const {
    if (!empty()) {
      size_t index = hash(key);
      auto attempts = capacity_;
      size_t mask = capacity_ - 1;
      while (attempts--) {
        Elem& e = elem_[index];
        auto state = e.state();
        if (state == State::VALID && e.key() == key) {
          return index;
        }
        if (state == State::EMPTY) {
          break;
        }
        index = (index + 1) & mask;
      }
    }
    return capacity_;
  }

  void erase_internal(Elem& e) {
    e.erase();
    DCHECK_GT(size(), 0);
    setSize(size() - 1);
  }

  /// Elem
  class Elem {
    std::atomic<State> state_;
    Key key_;
    std::atomic<Value> value_;

   public:
    Elem() : state_(State::EMPTY) {}

    FOLLY_ALWAYS_INLINE State state() const {
      return state_.load(std::memory_order_acquire);
    }

    FOLLY_ALWAYS_INLINE bool valid() const {
      return state() == State::VALID;
    }

    FOLLY_ALWAYS_INLINE Key key() const {
      return key_;
    }

    FOLLY_ALWAYS_INLINE Value value() const {
      return value_.load(std::memory_order_relaxed);
    }

    void setKey(Key key) {
      key_ = key;
    }

    void setValue(Value value) {
      value_.store(value, std::memory_order_relaxed);
    }

    void setValid() {
      state_.store(State::VALID, std::memory_order_release);
    }

    void erase() {
      state_.store(State::TOMBSTONE, std::memory_order_release);
    }
  }; // Elem

 public:
  /// Iterator
  class Iterator {
    Elem* elem_;
    size_t capacity_;
    size_t index_;

   public:
    FOLLY_ALWAYS_INLINE Key key() const {
      DCHECK_LT(index_, capacity_);
      Elem& e = elem_[index_];
      return e.key();
    }

    FOLLY_ALWAYS_INLINE Value value() const {
      DCHECK_LT(index_, capacity_);
      Elem& e = elem_[index_];
      return e.value();
    }

    FOLLY_ALWAYS_INLINE Iterator& operator++() {
      DCHECK_LT(index_, capacity_);
      ++index_;
      next();
      return *this;
    }

    FOLLY_ALWAYS_INLINE bool operator==(const Iterator& o) const {
      DCHECK(elem_ == o.elem_ || elem_ == nullptr || o.elem_ == nullptr);
      DCHECK_EQ(capacity_, o.capacity_);
      DCHECK_LE(index_, capacity_);
      return index_ == o.index_;
    }

    FOLLY_ALWAYS_INLINE bool operator!=(const Iterator& o) const {
      return !(*this == o);
    }

   private:
    friend class SingleWriterFixedHashMap;

    explicit Iterator(const SingleWriterFixedHashMap& m, size_t i = 0)
        : elem_(m.elem_.get()), capacity_(m.capacity_), index_(i) {
      if (index_ < capacity_) {
        next();
      }
    }

    FOLLY_ALWAYS_INLINE void next() {
      while (index_ < capacity_ && !elem_[index_].valid()) {
        ++index_;
      }
    }
  }; // Iterator
}; // SingleWriterFixedHashMap

} // namespace folly
