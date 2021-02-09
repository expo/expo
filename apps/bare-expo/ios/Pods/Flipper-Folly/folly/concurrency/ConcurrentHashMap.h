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
#include <folly/concurrency/detail/ConcurrentHashMap-detail.h>
#include <folly/synchronization/Hazptr.h>
#include <atomic>
#include <mutex>

namespace folly {

/**
 * Implementations of high-performance Concurrent Hashmaps that
 * support erase and update.
 *
 * Readers are always wait-free.
 * Writers are sharded, but take a lock.
 *
 * Multithreaded performance beats anything except the lock-free
 *      atomic maps (AtomicUnorderedMap, AtomicHashMap), BUT only
 *      if you can perfectly size the atomic maps, and you don't
 *      need erase().  If you don't know the size in advance or
 *      your workload frequently calls erase(), this is the
 *      better choice.
 *
 * The interface is as close to std::unordered_map as possible, but there
 * are a handful of changes:
 *
 * * Iterators hold hazard pointers to the returned elements.  Elements can only
 *   be accessed while Iterators are still valid!
 *
 * * Therefore operator[] and at() return copies, since they do not
 *   return an iterator.  The returned value is const, to remind you
 *   that changes do not affect the value in the map.
 *
 * * erase() calls the hash function, and may fail if the hash
 *   function throws an exception.
 *
 * * clear() initializes new segments, and is not noexcept.
 *
 * * The interface adds assign_if_equal, since find() doesn't take a lock.
 *
 * * Only const version of find() is supported, and const iterators.
 *   Mutation must use functions provided, like assign().
 *
 * * iteration iterates over all the buckets in the table, unlike
 *   std::unordered_map which iterates over a linked list of elements.
 *   If the table is sparse, this may be more expensive.
 *
 * * Allocator must be stateless.
 *
 * 1: ConcurrentHashMap, based on Java's ConcurrentHashMap.
 *    Very similar to std::unodered_map in performance.
 *
 * 2: ConcurrentHashMapSIMD, based on F14ValueMap.  If the map is
 *    larger than the cache size, it has superior performance due to
 *    vectorized key lookup.
 *
 *
 *
 * USAGE FAQs
 *
 * Q: Is simultaneous iteration and erase() threadsafe?
 *       Example:
 *
 *       ConcurrentHashMap<int, int> map;
 *
 *       Thread 1: auto it = map.begin();
 *                   while (it != map.end()) {
 *                      // Do something with it
 *                      it++;
 *                   }
 *
 *       Thread 2:    map.insert(2, 2);  map.erase(2);
 *
 * A: Yes, this is safe.  However, the iterating thread is not
 * garanteed to see (or not see) concurrent insertions and erasures.
 * Inserts may cause a rehash, but the old table is still valid as
 * long as any iterator pointing to it exists.
 *
 * Q: How do I update an existing object atomically?
 *
 * A: assign_if_equal is the recommended way - readers will see the
 * old value until the new value is completely constructed and
 * inserted.
 *
 * Q: Why does map.erase() not actually destroy elements?
 *
 * A: Hazard Pointers are used to improve the performance of
 * concurrent access.  They can be thought of as a simple Garbage
 * Collector.  To reduce the GC overhead, a GC pass is only run after
 * reaching a cetain memory bound.  erase() will remove the element
 * from being accessed via the map, but actual destruction may happen
 * later, after iterators that may point to it have been deleted.
 *
 * The only guarantee is that a GC pass will be run on map destruction
 * - no elements will remain after map destruction.
 *
 * Q: Are pointers to values safe to access *without* holding an
 * iterator?
 *
 * A: The SIMD version guarantees that references to elements are
 * stable across rehashes, the non-SIMD version does *not*.  Note that
 * unless you hold an iterator, you need to ensure there are no
 * concurrent deletes/updates to that key if you are accessing it via
 * reference.
 */

template <
    typename KeyType,
    typename ValueType,
    typename HashFn = std::hash<KeyType>,
    typename KeyEqual = std::equal_to<KeyType>,
    typename Allocator = std::allocator<uint8_t>,
    uint8_t ShardBits = 8,
    template <typename> class Atom = std::atomic,
    class Mutex = std::mutex,
    template <
        typename,
        typename,
        uint8_t,
        typename,
        typename,
        typename,
        template <typename> class,
        class> class Impl = detail::concurrenthashmap::bucket::BucketTable>
class ConcurrentHashMap {
  using SegmentT = detail::ConcurrentHashMapSegment<
      KeyType,
      ValueType,
      ShardBits,
      HashFn,
      KeyEqual,
      Allocator,
      Atom,
      Mutex,
      Impl>;

  float load_factor_ = SegmentT::kDefaultLoadFactor;

  static constexpr uint64_t NumShards = (1 << ShardBits);

 public:
  class ConstIterator;

  typedef KeyType key_type;
  typedef ValueType mapped_type;
  typedef std::pair<const KeyType, ValueType> value_type;
  typedef std::size_t size_type;
  typedef HashFn hasher;
  typedef KeyEqual key_equal;
  typedef ConstIterator const_iterator;

  /*
   * Construct a ConcurrentHashMap with 1 << ShardBits shards, size
   * and max_size given.  Both size and max_size will be rounded up to
   * the next power of two, if they are not already a power of two, so
   * that we can index in to Shards efficiently.
   *
   * Insertion functions will throw bad_alloc if max_size is exceeded.
   */
  explicit ConcurrentHashMap(size_t size = 8, size_t max_size = 0) {
    size_ = folly::nextPowTwo(size);
    if (max_size != 0) {
      max_size_ = folly::nextPowTwo(max_size);
    }
    CHECK(max_size_ == 0 || max_size_ >= size_);
    for (uint64_t i = 0; i < NumShards; i++) {
      segments_[i].store(nullptr, std::memory_order_relaxed);
    }
  }

  ConcurrentHashMap(ConcurrentHashMap&& o) noexcept
      : size_(o.size_), max_size_(o.max_size_) {
    for (uint64_t i = 0; i < NumShards; i++) {
      segments_[i].store(
          o.segments_[i].load(std::memory_order_relaxed),
          std::memory_order_relaxed);
      o.segments_[i].store(nullptr, std::memory_order_relaxed);
    }
    cohort_.store(o.cohort(), std::memory_order_relaxed);
    o.cohort_.store(nullptr, std::memory_order_relaxed);
  }

  ConcurrentHashMap& operator=(ConcurrentHashMap&& o) {
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_relaxed);
      if (seg) {
        seg->~SegmentT();
        Allocator().deallocate((uint8_t*)seg, sizeof(SegmentT));
      }
      segments_[i].store(
          o.segments_[i].load(std::memory_order_relaxed),
          std::memory_order_relaxed);
      o.segments_[i].store(nullptr, std::memory_order_relaxed);
    }
    size_ = o.size_;
    max_size_ = o.max_size_;
    cohort_shutdown_cleanup();
    cohort_.store(o.cohort(), std::memory_order_relaxed);
    o.cohort_.store(nullptr, std::memory_order_relaxed);
    return *this;
  }

  ~ConcurrentHashMap() {
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_relaxed);
      if (seg) {
        seg->~SegmentT();
        Allocator().deallocate((uint8_t*)seg, sizeof(SegmentT));
      }
    }
    cohort_shutdown_cleanup();
  }

  bool empty() const noexcept {
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_acquire);
      if (seg) {
        if (!seg->empty()) {
          return false;
        }
      }
    }
    return true;
  }

  ConstIterator find(const KeyType& k) const {
    auto segment = pickSegment(k);
    ConstIterator res(this, segment);
    auto seg = segments_[segment].load(std::memory_order_acquire);
    if (!seg || !seg->find(res.it_, k)) {
      res.segment_ = NumShards;
    }
    return res;
  }

  ConstIterator cend() const noexcept {
    return ConstIterator(NumShards);
  }

  ConstIterator cbegin() const noexcept {
    return ConstIterator(this);
  }

  ConstIterator end() const noexcept {
    return cend();
  }

  ConstIterator begin() const noexcept {
    return cbegin();
  }

  std::pair<ConstIterator, bool> insert(
      std::pair<key_type, mapped_type>&& foo) {
    auto segment = pickSegment(foo.first);
    std::pair<ConstIterator, bool> res(
        std::piecewise_construct,
        std::forward_as_tuple(this, segment),
        std::forward_as_tuple(false));
    res.second = ensureSegment(segment)->insert(res.first.it_, std::move(foo));
    return res;
  }

  template <typename Key, typename Value>
  std::pair<ConstIterator, bool> insert(Key&& k, Value&& v) {
    auto segment = pickSegment(k);
    std::pair<ConstIterator, bool> res(
        std::piecewise_construct,
        std::forward_as_tuple(this, segment),
        std::forward_as_tuple(false));
    res.second = ensureSegment(segment)->insert(
        res.first.it_, std::forward<Key>(k), std::forward<Value>(v));
    return res;
  }

  template <typename Key, typename... Args>
  std::pair<ConstIterator, bool> try_emplace(Key&& k, Args&&... args) {
    auto segment = pickSegment(k);
    std::pair<ConstIterator, bool> res(
        std::piecewise_construct,
        std::forward_as_tuple(this, segment),
        std::forward_as_tuple(false));
    res.second = ensureSegment(segment)->try_emplace(
        res.first.it_, std::forward<Key>(k), std::forward<Args>(args)...);
    return res;
  }

  template <typename... Args>
  std::pair<ConstIterator, bool> emplace(Args&&... args) {
    using Node = typename SegmentT::Node;
    auto node = (Node*)Allocator().allocate(sizeof(Node));
    new (node) Node(ensureCohort(), std::forward<Args>(args)...);
    auto segment = pickSegment(node->getItem().first);
    std::pair<ConstIterator, bool> res(
        std::piecewise_construct,
        std::forward_as_tuple(this, segment),
        std::forward_as_tuple(false));
    res.second = ensureSegment(segment)->emplace(
        res.first.it_, node->getItem().first, node);
    if (!res.second) {
      node->~Node();
      Allocator().deallocate((uint8_t*)node, sizeof(Node));
    }
    return res;
  }

  /*
   * The bool component will always be true if the map has been updated via
   * either insertion or assignment. Note that this is different from the
   * std::map::insert_or_assign interface.
   */
  template <typename Key, typename Value>
  std::pair<ConstIterator, bool> insert_or_assign(Key&& k, Value&& v) {
    auto segment = pickSegment(k);
    std::pair<ConstIterator, bool> res(
        std::piecewise_construct,
        std::forward_as_tuple(this, segment),
        std::forward_as_tuple(false));
    res.second = ensureSegment(segment)->insert_or_assign(
        res.first.it_, std::forward<Key>(k), std::forward<Value>(v));
    return res;
  }

  template <typename Key, typename Value>
  folly::Optional<ConstIterator> assign(Key&& k, Value&& v) {
    auto segment = pickSegment(k);
    ConstIterator res(this, segment);
    auto seg = segments_[segment].load(std::memory_order_acquire);
    if (!seg) {
      return none;
    } else {
      auto r =
          seg->assign(res.it_, std::forward<Key>(k), std::forward<Value>(v));
      if (!r) {
        return none;
      }
    }
    return std::move(res);
  }

  // Assign to desired if and only if key k is equal to expected
  template <typename Key, typename Value>
  folly::Optional<ConstIterator>
  assign_if_equal(Key&& k, const ValueType& expected, Value&& desired) {
    auto segment = pickSegment(k);
    ConstIterator res(this, segment);
    auto seg = segments_[segment].load(std::memory_order_acquire);
    if (!seg) {
      return none;
    } else {
      auto r = seg->assign_if_equal(
          res.it_,
          std::forward<Key>(k),
          expected,
          std::forward<Value>(desired));
      if (!r) {
        return none;
      }
    }
    return std::move(res);
  }

  // Copying wrappers around insert and find.
  // Only available for copyable types.
  const ValueType operator[](const KeyType& key) {
    auto item = insert(key, ValueType());
    return item.first->second;
  }

  const ValueType at(const KeyType& key) const {
    auto item = find(key);
    if (item == cend()) {
      throw std::out_of_range("at(): value out of range");
    }
    return item->second;
  }

  // TODO update assign interface, operator[], at

  size_type erase(const key_type& k) {
    auto segment = pickSegment(k);
    auto seg = segments_[segment].load(std::memory_order_acquire);
    if (!seg) {
      return 0;
    } else {
      return seg->erase(k);
    }
  }

  // Calls the hash function, and therefore may throw.
  ConstIterator erase(ConstIterator& pos) {
    auto segment = pickSegment(pos->first);
    ConstIterator res(this, segment);
    ensureSegment(segment)->erase(res.it_, pos.it_);
    res.next(); // May point to segment end, and need to advance.
    return res;
  }

  // Erase if and only if key k is equal to expected
  size_type erase_if_equal(const key_type& k, const ValueType& expected) {
    auto segment = pickSegment(k);
    auto seg = segments_[segment].load(std::memory_order_acquire);
    if (!seg) {
      return 0;
    }
    return seg->erase_if_equal(k, expected);
  }

  // NOT noexcept, initializes new shard segments vs.
  void clear() {
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_acquire);
      if (seg) {
        seg->clear();
      }
    }
  }

  void reserve(size_t count) {
    count = count >> ShardBits;
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_acquire);
      if (seg) {
        seg->rehash(count);
      }
    }
  }

  // This is a rolling size, and is not exact at any moment in time.
  size_t size() const noexcept {
    size_t res = 0;
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_acquire);
      if (seg) {
        res += seg->size();
      }
    }
    return res;
  }

  float max_load_factor() const {
    return load_factor_;
  }

  void max_load_factor(float factor) {
    for (uint64_t i = 0; i < NumShards; i++) {
      auto seg = segments_[i].load(std::memory_order_acquire);
      if (seg) {
        seg->max_load_factor(factor);
      }
    }
  }

  class ConstIterator {
   public:
    friend class ConcurrentHashMap;

    const value_type& operator*() const {
      return *it_;
    }

    const value_type* operator->() const {
      return &*it_;
    }

    ConstIterator& operator++() {
      ++it_;
      next();
      return *this;
    }

    bool operator==(const ConstIterator& o) const {
      return it_ == o.it_ && segment_ == o.segment_;
    }

    bool operator!=(const ConstIterator& o) const {
      return !(*this == o);
    }

    ConstIterator& operator=(const ConstIterator& o) = delete;

    ConstIterator& operator=(ConstIterator&& o) noexcept {
      if (this != &o) {
        it_ = std::move(o.it_);
        segment_ = std::exchange(o.segment_, uint64_t(NumShards));
        parent_ = std::exchange(o.parent_, nullptr);
      }
      return *this;
    }

    ConstIterator(const ConstIterator& o) = delete;

    ConstIterator(ConstIterator&& o) noexcept
        : it_(std::move(o.it_)),
          segment_(std::exchange(o.segment_, uint64_t(NumShards))),
          parent_(std::exchange(o.parent_, nullptr)) {}

    ConstIterator(const ConcurrentHashMap* parent, uint64_t segment)
        : segment_(segment), parent_(parent) {}

   private:
    // cbegin iterator
    explicit ConstIterator(const ConcurrentHashMap* parent)
        : it_(parent->ensureSegment(0)->cbegin()),
          segment_(0),
          parent_(parent) {
      // Always iterate to the first element, could be in any shard.
      next();
    }

    // cend iterator
    explicit ConstIterator(uint64_t shards) : it_(nullptr), segment_(shards) {}

    void next() {
      while (segment_ < parent_->NumShards &&
             it_ == parent_->ensureSegment(segment_)->cend()) {
        SegmentT* seg{nullptr};
        while (!seg) {
          segment_++;
          if (segment_ < parent_->NumShards) {
            seg = parent_->segments_[segment_].load(std::memory_order_acquire);
            if (!seg) {
              continue;
            }
            it_ = seg->cbegin();
          }
          break;
        }
      }
    }

    typename SegmentT::Iterator it_;
    uint64_t segment_;
    const ConcurrentHashMap* parent_;
  };

 private:
  uint64_t pickSegment(const KeyType& k) const {
    auto h = HashFn()(k);
    // Use the lowest bits for our shard bits.
    //
    // This works well even if the hash function is biased towards the
    // low bits: The sharding will happen in the segments_ instead of
    // in the segment buckets, so we'll still get write sharding as
    // well.
    //
    // Low-bit bias happens often for std::hash using small numbers,
    // since the integer hash function is the identity function.
    return h & (NumShards - 1);
  }

  SegmentT* ensureSegment(uint64_t i) const {
    SegmentT* seg = segments_[i].load(std::memory_order_acquire);
    if (!seg) {
      auto b = ensureCohort();
      SegmentT* newseg = (SegmentT*)Allocator().allocate(sizeof(SegmentT));
      newseg = new (newseg)
          SegmentT(size_ >> ShardBits, load_factor_, max_size_ >> ShardBits, b);
      if (!segments_[i].compare_exchange_strong(seg, newseg)) {
        // seg is updated with new value, delete ours.
        newseg->~SegmentT();
        Allocator().deallocate((uint8_t*)newseg, sizeof(SegmentT));
      } else {
        seg = newseg;
      }
    }
    return seg;
  }

  hazptr_obj_cohort<Atom>* cohort() const noexcept {
    return cohort_.load(std::memory_order_acquire);
  }

  hazptr_obj_cohort<Atom>* ensureCohort() const {
    auto b = cohort();
    if (!b) {
      auto storage = Allocator().allocate(sizeof(hazptr_obj_cohort<Atom>));
      auto newcohort = new (storage) hazptr_obj_cohort<Atom>();
      if (cohort_.compare_exchange_strong(b, newcohort)) {
        b = newcohort;
      } else {
        newcohort->~hazptr_obj_cohort<Atom>();
        Allocator().deallocate(storage, sizeof(hazptr_obj_cohort<Atom>));
      }
    }
    return b;
  }

  void cohort_shutdown_cleanup() {
    auto b = cohort();
    if (b) {
      b->~hazptr_obj_cohort<Atom>();
      Allocator().deallocate((uint8_t*)b, sizeof(hazptr_obj_cohort<Atom>));
    }
  }

  mutable Atom<SegmentT*> segments_[NumShards];
  size_t size_{0};
  size_t max_size_{0};
  mutable Atom<hazptr_obj_cohort<Atom>*> cohort_{nullptr};
};

#if FOLLY_SSE_PREREQ(4, 2) && !FOLLY_MOBILE
template <
    typename KeyType,
    typename ValueType,
    typename HashFn = std::hash<KeyType>,
    typename KeyEqual = std::equal_to<KeyType>,
    typename Allocator = std::allocator<uint8_t>,
    uint8_t ShardBits = 8,
    template <typename> class Atom = std::atomic,
    class Mutex = std::mutex>
using ConcurrentHashMapSIMD = ConcurrentHashMap<
    KeyType,
    ValueType,
    HashFn,
    KeyEqual,
    Allocator,
    ShardBits,
    Atom,
    Mutex,
    detail::concurrenthashmap::simd::SIMDTable>;
#endif

} // namespace folly
