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
#include <cstddef>
#include <type_traits>

namespace folly {

class reentrant_allocator_options {
 public:
  //  block_size_lg
  //
  //  The log2 of the block size, which is the size of the blocks from which
  //  small allocations are returned.
  std::size_t block_size_lg() const noexcept {
    return block_size_lg_;
  }
  reentrant_allocator_options& block_size_lg(std::size_t const value) noexcept {
    block_size_lg_ = value;
    return *this;
  }

  //  large_size_lg
  //
  //  The log2 of the large size, which is the size starting at which
  //  allocations are considered large and are returned directly from mmap.
  std::size_t large_size_lg() const noexcept {
    return large_size_lg_;
  }
  reentrant_allocator_options& large_size_lg(std::size_t const value) noexcept {
    large_size_lg_ = value;
    return *this;
  }

 private:
  std::size_t block_size_lg_ = 16;
  std::size_t large_size_lg_ = 12;
};

namespace detail {

class reentrant_allocator_base {
 public:
  explicit reentrant_allocator_base(
      reentrant_allocator_options const& options) noexcept;
  reentrant_allocator_base(reentrant_allocator_base const& that) noexcept;
  reentrant_allocator_base& operator=(
      reentrant_allocator_base const& that) noexcept;
  ~reentrant_allocator_base();

  void* allocate(std::size_t n, std::size_t a) noexcept;
  void deallocate(void* p, std::size_t n) noexcept;

  friend bool operator==(
      reentrant_allocator_base const& a,
      reentrant_allocator_base const& b) noexcept {
    return a.meta_ == b.meta_;
  }
  friend bool operator!=(
      reentrant_allocator_base const& a,
      reentrant_allocator_base const& b) noexcept {
    return a.meta_ != b.meta_;
  }

 private:
  //  For small sizes, maintain a shared list of segments. Segments are each
  //  allocated via mmap, chained together into a list, and collectively
  //  refcounted. When the last copy of the allocator is destroyed, segments
  //  are deallocated all at once via munmap. Node is the header data
  //  structure prefixing each segment while Meta is the data structure
  //  representing shared ownership of the segment list. Serve allocations
  //  from the head segment if it exists and has space, otherwise mmap and
  //  chain a new segment and serve allocations from it. Serve deallocations
  //  by doing nothing at all.
  struct node_t {
    node_t* next = nullptr;
    std::atomic<std::size_t> size{sizeof(node_t)};
    explicit node_t(node_t* next_) noexcept : next{next_} {}
  };

  //  The shared state which all copies of the allocator share.
  struct meta_t {
    //  Small allocations are served from block-sized segments.
    std::size_t const block_size = 0;
    //  Large allocations are served directly.
    std::size_t const large_size = 0;
    //  The refcount is atomic to permit some copies of the allocator to be
    //  destroyed concurrently with uses of other copies of the allocator.
    //  This lets an allocator be copied in a signal handler and the copy
    //  be destroyed outside the signal handler.
    std::atomic<std::size_t> refs{1};
    //  The segment list head. All small allocations happen via the head node
    //  if possible, or via a new head node otherwise.
    std::atomic<node_t*> head{nullptr};

    explicit meta_t(reentrant_allocator_options const& options) noexcept
        : block_size{std::size_t(1) << options.block_size_lg()},
          large_size{std::size_t(1) << options.large_size_lg()} {}
  };

  //  Deduplicates code between dtor and copy-assignment.
  void obliterate() noexcept;

  //  The allocator has all state in the shared state, keeping only a pointer.
  meta_t* meta_{nullptr};
};

} // namespace detail

//  reentrant_allocator
//
//  A reentrant mmap-based allocator.
//
//  Safety:
//  * multi-thread-safe
//  * async-signal-safe
//
//  The basic approach is in two parts:
//  * For large sizes, serve allocations and deallocations directly via mmap and
//    munmap and without any extra tracking.
//  * For small sizes, serve allocations from a refcounted shared list of
//    segments and defer deallocations to amortize calls to mmap and munmap - in
//    other words, a shared arena list.
//
//  Large allocations are aligned to page boundaries, even if the type's natural
//  alignment is larger.
//
//  Assumptions:
//  * The mmap and munmap libc functions are async-signal-safe in practice even
//    though POSIX does not require them to be.
//  * The instances of std::atomic over size_t and pointer types are lock-free
//    and operations on them are async-signal-safe.
template <typename T>
class reentrant_allocator : private detail::reentrant_allocator_base {
 private:
  template <typename>
  friend class reentrant_allocator;

  using base = detail::reentrant_allocator_base;

 public:
  using value_type = T;

  using base::base;

  template <typename U, std::enable_if_t<!std::is_same<U, T>::value, int> = 0>
  /* implicit */ reentrant_allocator(
      reentrant_allocator<U> const& that) noexcept
      : base{that} {}

  T* allocate(std::size_t n) {
    return static_cast<T*>(base::allocate(n * sizeof(T), alignof(T)));
  }
  void deallocate(T* p, std::size_t n) {
    base::deallocate(p, n * sizeof(T));
  }

  template <typename A, typename B>
  friend bool operator==(
      reentrant_allocator<A> const& a,
      reentrant_allocator<B> const& b) noexcept;
  template <typename A, typename B>
  friend bool operator!=(
      reentrant_allocator<A> const& a,
      reentrant_allocator<B> const& b) noexcept;
};

template <typename A, typename B>
bool operator==(
    reentrant_allocator<A> const& a,
    reentrant_allocator<B> const& b) noexcept {
  using base = detail::reentrant_allocator_base;
  return static_cast<base const&>(a) == static_cast<base const&>(b);
}
template <typename A, typename B>
bool operator!=(
    reentrant_allocator<A> const& a,
    reentrant_allocator<B> const& b) noexcept {
  using base = detail::reentrant_allocator_base;
  return static_cast<base const&>(a) != static_cast<base const&>(b);
}

} // namespace folly
