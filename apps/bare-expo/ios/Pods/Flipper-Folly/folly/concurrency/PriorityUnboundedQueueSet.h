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

#include <atomic>
#include <vector>

#include <folly/Memory.h>
#include <folly/concurrency/UnboundedQueue.h>
#include <folly/lang/Align.h>

namespace folly {

/// PriorityUnboundedQueueSet
///
/// A set of per-priority queues, and an interface for accessing them.
///
/// Functions:
///   Consumer operations:
///     bool try_dequeue(T&);
///     Optional<T> try_dequeue();
///       Tries to extract an element from the front of the least-priority
///       backing queue which has an element, if any.
///     T const* try_peek();
///       Returns a pointer to the element at the front of the least-priority
///       backing queue which has an element, if any. Only allowed when
///       SingleConsumer is true.
///     Note:
///       Queues at lower priority are tried before queues at higher priority.
///
///   Secondary functions:
///     queue& at_priority(size_t);
///     queue const& at_priority(size_t) const;
///       Returns a reference to the owned queue at the given priority.
///     size_t size() const;
///       Returns an estimate of the total size of the owned queues.
///     bool empty() const;
///       Returns true only if all of the owned queues were empty during the
///       call.
///     Note: size() and empty() are guaranteed to be accurate only if the
///       owned queues are not changed concurrently.
template <
    typename T,
    bool SingleProducer,
    bool SingleConsumer,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
class PriorityUnboundedQueueSet {
 public:
  using queue = UnboundedQueue<
      T,
      SingleProducer,
      SingleConsumer,
      MayBlock,
      LgSegmentSize,
      LgAlign,
      Atom>;

  explicit PriorityUnboundedQueueSet(size_t priorities) : queues_(priorities) {}

  PriorityUnboundedQueueSet(PriorityUnboundedQueueSet const&) = delete;
  PriorityUnboundedQueueSet(PriorityUnboundedQueueSet&&) = delete;
  PriorityUnboundedQueueSet& operator=(PriorityUnboundedQueueSet const&) =
      delete;
  PriorityUnboundedQueueSet& operator=(PriorityUnboundedQueueSet&&) = delete;

  queue& at_priority(size_t priority) {
    return queues_.at(priority);
  }

  queue const& at_priority(size_t priority) const {
    return queues_.at(priority);
  }

  bool try_dequeue(T& item) noexcept {
    for (auto& q : queues_) {
      if (q.try_dequeue(item)) {
        return true;
      }
    }
    return false;
  }

  Optional<T> try_dequeue() noexcept {
    for (auto& q : queues_) {
      if (auto item = q.try_dequeue()) {
        return item;
      }
    }
    return none;
  }

  T const* try_peek() noexcept {
    DCHECK(SingleConsumer);
    for (auto& q : queues_) {
      if (auto ptr = q.try_peek()) {
        return ptr;
      }
    }
    return nullptr;
  }

  size_t size() const noexcept {
    size_t size = 0;
    for (auto& q : queues_) {
      size += q.size();
    }
    return size;
  }

  bool empty() const noexcept {
    for (auto& q : queues_) {
      if (!q.empty()) {
        return false;
      }
    }
    return true;
  }

  size_t priorities() const noexcept {
    return queues_.size();
  }

 private:
  //  queue_alloc custom allocator is necessary until C++17
  //    http://open-std.org/JTC1/SC22/WG21/docs/papers/2012/n3396.htm
  //    https://gcc.gnu.org/bugzilla/show_bug.cgi?id=65122
  //    https://bugs.llvm.org/show_bug.cgi?id=22634
  using queue_alloc = AlignedSysAllocator<queue, FixedAlign<alignof(queue)>>;
  std::vector<queue, queue_alloc> queues_;
}; // PriorityUnboundedQueueSet

/* Aliases */

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using PriorityUSPSCQueueSet = PriorityUnboundedQueueSet<
    T,
    true,
    true,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    Atom>;

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using PriorityUMPSCQueueSet = PriorityUnboundedQueueSet<
    T,
    false,
    true,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    Atom>;

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using PriorityUSPMCQueueSet = PriorityUnboundedQueueSet<
    T,
    true,
    false,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    Atom>;

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using PriorityUMPMCQueueSet = PriorityUnboundedQueueSet<
    T,
    false,
    false,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    Atom>;

} // namespace folly
