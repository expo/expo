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

#include <folly/memory/ReentrantAllocator.h>

#include <new>
#include <utility>

#include <folly/lang/Bits.h>
#include <folly/lang/SafeAssert.h>
#include <folly/portability/SysMman.h>

namespace folly {

namespace {

max_align_t dummy; // return value for zero-sized allocations

void* reentrant_allocate(std::size_t const n) noexcept {
  FOLLY_SAFE_CHECK(n, "zero-sized");
  auto const prot = PROT_READ | PROT_WRITE;
  auto const flags = MAP_ANONYMOUS | MAP_PRIVATE;
  auto const addr = ::mmap(nullptr, n, prot, flags, 0, 0);
  FOLLY_SAFE_PCHECK(addr != MAP_FAILED, "mmap failed");
  return addr;
}

void reentrant_deallocate(void* const p, std::size_t const n) noexcept {
  FOLLY_SAFE_CHECK(p, "null-pointer");
  FOLLY_SAFE_CHECK(n, "zero-sized");
  auto const err = ::munmap(p, n);
  FOLLY_SAFE_PCHECK(!err, "munmap failed");
}

} // namespace

namespace detail {

reentrant_allocator_base::reentrant_allocator_base(
    reentrant_allocator_options const& options) noexcept {
  meta_ = static_cast<meta_t*>(reentrant_allocate(sizeof(meta_t)));
  ::new (meta_) meta_t(options);
}

reentrant_allocator_base::reentrant_allocator_base(
    reentrant_allocator_base const& that) noexcept {
  meta_ = that.meta_;
  meta_->refs.fetch_add(1, std::memory_order_relaxed);
}

reentrant_allocator_base& reentrant_allocator_base::operator=(
    reentrant_allocator_base const& that) noexcept {
  if (this != &that) {
    if (meta_->refs.fetch_sub(1, std::memory_order_acq_rel) - 1 == 0) {
      obliterate();
    }
    meta_ = that.meta_;
    meta_->refs.fetch_add(1, std::memory_order_relaxed);
  }
  return *this;
}

reentrant_allocator_base::~reentrant_allocator_base() {
  if (meta_->refs.fetch_sub(1, std::memory_order_acq_rel) - 1 == 0) {
    obliterate();
  }
}

void* reentrant_allocator_base::allocate(
    std::size_t const n,
    std::size_t const a) noexcept {
  if (!n) {
    return &dummy;
  }
  //  large requests are handled directly
  if (n >= meta_->large_size) {
    return reentrant_allocate(n);
  }
  auto const block_size = meta_->block_size;
  //  small requests are handled from the shared arena list:
  //  * if the list is empty or the list head has insufficient space, c/x a new
  //    list head, starting over on failure
  //  * then c/x the list head size to the new size, starting over on failure
  while (true) {
    //  load head - non-const because used in c/x below
    auto head = meta_->head.load(std::memory_order_acquire);
    //  load size - non-const because used in c/x below
    //  size is where the prev allocation ends, if any
    auto size = head //
        ? head->size.load(std::memory_order_acquire)
        : block_size;
    //  offset is where the next allocation starts, and is aligned as a
    auto const offset = (size + a - 1) & ~(a - 1);
    //  if insufficient space in current segment or no current segment at all
    if (offset + n > block_size || !head) {
      //  mmap a new segment and try to c/x it in to be the segment list head
      auto const newhead = static_cast<node_t*>(reentrant_allocate(block_size));
      ::new (newhead) node_t(head);
      auto const exchanged = meta_->head.compare_exchange_weak(
          head, newhead, std::memory_order_release, std::memory_order_relaxed);
      if (!exchanged) {
        //  lost the race - munmap the new segment and start over
        reentrant_deallocate(newhead, block_size);
        continue;
      }
      head = newhead;
    }
    //  compute the new size and try to c/x it in to be the head segment size
    auto const newsize = offset + n;
    auto const exchanged = head->size.compare_exchange_weak(
        size, newsize, std::memory_order_release, std::memory_order_relaxed);
    if (!exchanged) {
      //  lost the race - start over
      continue;
    }
    return reinterpret_cast<char*>(head) + offset;
  }
}

void reentrant_allocator_base::deallocate(
    void* const p,
    std::size_t const n) noexcept {
  if (p == &dummy) {
    FOLLY_SAFE_CHECK(n == 0, "unexpected non-zero size");
    return;
  }
  if (!n || !p) {
    return;
  }
  //  large requests are handled directly
  if (n >= meta_->large_size) {
    reentrant_deallocate(p, n);
    return;
  }
  //  small requests are deferred to allocator destruction, so no-op here
}

void reentrant_allocator_base::obliterate() noexcept {
  auto head = meta_->head.load(std::memory_order_acquire);
  while (head != nullptr) {
    auto const prev = std::exchange(head, head->next);
    reentrant_deallocate(prev, meta_->block_size);
  }
  reentrant_deallocate(meta_, sizeof(meta_));
  meta_ = nullptr;
}

} // namespace detail

} // namespace folly
