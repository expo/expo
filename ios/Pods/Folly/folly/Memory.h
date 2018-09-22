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

#include <folly/Traits.h>

#include <cstddef>
#include <cstdlib>
#include <exception>
#include <limits>
#include <memory>
#include <stdexcept>
#include <utility>

namespace folly {

/**
 * For exception safety and consistency with make_shared. Erase me when
 * we have std::make_unique().
 *
 * @author Louis Brandy (ldbrandy@fb.com)
 * @author Xu Ning (xning@fb.com)
 */

#if __cplusplus >= 201402L ||                                              \
    (defined __cpp_lib_make_unique && __cpp_lib_make_unique >= 201304L) || \
    (defined(_MSC_VER) && _MSC_VER >= 1900)

/* using override */ using std::make_unique;

#else

template<typename T, typename... Args>
typename std::enable_if<!std::is_array<T>::value, std::unique_ptr<T>>::type
make_unique(Args&&... args) {
  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

// Allows 'make_unique<T[]>(10)'. (N3690 s20.9.1.4 p3-4)
template<typename T>
typename std::enable_if<std::is_array<T>::value, std::unique_ptr<T>>::type
make_unique(const size_t n) {
  return std::unique_ptr<T>(new typename std::remove_extent<T>::type[n]());
}

// Disallows 'make_unique<T[10]>()'. (N3690 s20.9.1.4 p5)
template<typename T, typename... Args>
typename std::enable_if<
  std::extent<T>::value != 0, std::unique_ptr<T>>::type
make_unique(Args&&...) = delete;

#endif

/**
 * static_function_deleter
 *
 * So you can write this:
 *
 *      using RSA_deleter = folly::static_function_deleter<RSA, &RSA_free>;
 *      auto rsa = std::unique_ptr<RSA, RSA_deleter>(RSA_new());
 *      RSA_generate_key_ex(rsa.get(), bits, exponent, nullptr);
 *      rsa = nullptr;  // calls RSA_free(rsa.get())
 *
 * This would be sweet as well for BIO, but unfortunately BIO_free has signature
 * int(BIO*) while we require signature void(BIO*). So you would need to make a
 * wrapper for it:
 *
 *      inline void BIO_free_fb(BIO* bio) { CHECK_EQ(1, BIO_free(bio)); }
 *      using BIO_deleter = folly::static_function_deleter<BIO, &BIO_free_fb>;
 *      auto buf = std::unique_ptr<BIO, BIO_deleter>(BIO_new(BIO_s_mem()));
 *      buf = nullptr;  // calls BIO_free(buf.get())
 */

template <typename T, void(*f)(T*)>
struct static_function_deleter {
  void operator()(T* t) const {
    f(t);
  }
};

/**
 *  to_shared_ptr
 *
 *  Convert unique_ptr to shared_ptr without specifying the template type
 *  parameter and letting the compiler deduce it.
 *
 *  So you can write this:
 *
 *      auto sptr = to_shared_ptr(getSomethingUnique<T>());
 *
 *  Instead of this:
 *
 *      auto sptr = shared_ptr<T>(getSomethingUnique<T>());
 *
 *  Useful when `T` is long, such as:
 *
 *      using T = foobar::cpp2::FooBarServiceAsyncClient;
 */
template <typename T, typename D>
std::shared_ptr<T> to_shared_ptr(std::unique_ptr<T, D>&& ptr) {
  return std::shared_ptr<T>(std::move(ptr));
}

using SysBufferDeleter = static_function_deleter<void, ::free>;
using SysBufferUniquePtr = std::unique_ptr<void, SysBufferDeleter>;
inline SysBufferUniquePtr allocate_sys_buffer(size_t size) {
  return SysBufferUniquePtr(::malloc(size));
}

/**
 * A SimpleAllocator must provide two methods:
 *
 *    void* allocate(size_t size);
 *    void deallocate(void* ptr);
 *
 * which, respectively, allocate a block of size bytes (aligned to the
 * maximum alignment required on your system), throwing std::bad_alloc
 * if the allocation can't be satisfied, and free a previously
 * allocated block.
 *
 * SysAlloc resembles the standard allocator.
 */
class SysAlloc {
 public:
  void* allocate(size_t size) {
    void* p = ::malloc(size);
    if (!p) throw std::bad_alloc();
    return p;
  }
  void deallocate(void* p) {
    ::free(p);
  }
};

/**
 * StlAllocator wraps a SimpleAllocator into a STL-compliant
 * allocator, maintaining an instance pointer to the simple allocator
 * object.  The underlying SimpleAllocator object must outlive all
 * instances of StlAllocator using it.
 *
 * But note that if you pass StlAllocator<MallocAllocator,...> to a
 * standard container it will be larger due to the contained state
 * pointer.
 *
 * @author: Tudor Bosman <tudorb@fb.com>
 */

// This would be so much simpler with std::allocator_traits, but gcc 4.6.2
// doesn't support it.
template <class Alloc, class T> class StlAllocator;

template <class Alloc> class StlAllocator<Alloc, void> {
 public:
  typedef void value_type;
  typedef void* pointer;
  typedef const void* const_pointer;

  StlAllocator() : alloc_(nullptr) { }
  explicit StlAllocator(Alloc* a) : alloc_(a) { }

  Alloc* alloc() const {
    return alloc_;
  }

  template <class U> struct rebind {
    typedef StlAllocator<Alloc, U> other;
  };

  bool operator!=(const StlAllocator<Alloc, void>& other) const {
    return alloc_ != other.alloc_;
  }

  bool operator==(const StlAllocator<Alloc, void>& other) const {
    return alloc_ == other.alloc_;
  }

 private:
  Alloc* alloc_;
};

template <class Alloc, class T>
class StlAllocator {
 public:
  typedef T value_type;
  typedef T* pointer;
  typedef const T* const_pointer;
  typedef T& reference;
  typedef const T& const_reference;

  typedef ptrdiff_t difference_type;
  typedef size_t size_type;

  StlAllocator() : alloc_(nullptr) { }
  explicit StlAllocator(Alloc* a) : alloc_(a) { }

  template <class U> StlAllocator(const StlAllocator<Alloc, U>& other)
    : alloc_(other.alloc()) { }

  T* allocate(size_t n, const void* /* hint */ = nullptr) {
    return static_cast<T*>(alloc_->allocate(n * sizeof(T)));
  }

  void deallocate(T* p, size_t /* n */) { alloc_->deallocate(p); }

  size_t max_size() const {
    return std::numeric_limits<size_t>::max();
  }

  T* address(T& x) const {
    return std::addressof(x);
  }

  const T* address(const T& x) const {
    return std::addressof(x);
  }

  template <class... Args>
  void construct(T* p, Args&&... args) {
    new (p) T(std::forward<Args>(args)...);
  }

  void destroy(T* p) {
    p->~T();
  }

  Alloc* alloc() const {
    return alloc_;
  }

  template <class U> struct rebind {
    typedef StlAllocator<Alloc, U> other;
  };

  bool operator!=(const StlAllocator<Alloc, T>& other) const {
    return alloc_ != other.alloc_;
  }

  bool operator==(const StlAllocator<Alloc, T>& other) const {
    return alloc_ == other.alloc_;
  }

 private:
  Alloc* alloc_;
};

/**
 * Helper function to obtain rebound allocators
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */
template <typename T, typename Allocator>
typename Allocator::template rebind<T>::other rebind_allocator(
  Allocator const& allocator
) {
  return typename Allocator::template rebind<T>::other(allocator);
}

/*
 * Helper classes/functions for creating a unique_ptr using a custom
 * allocator.
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */

// Derives from the allocator to take advantage of the empty base
// optimization when possible.
template <typename Allocator>
class allocator_delete
  : private std::remove_reference<Allocator>::type
{
  typedef typename std::remove_reference<Allocator>::type allocator_type;

public:
  typedef typename Allocator::pointer pointer;

  allocator_delete() = default;

  explicit allocator_delete(const allocator_type& allocator)
    : allocator_type(allocator)
  {}

  explicit allocator_delete(allocator_type&& allocator)
    : allocator_type(std::move(allocator))
  {}

  template <typename U>
  allocator_delete(const allocator_delete<U>& other)
    : allocator_type(other.get_allocator())
  {}

  allocator_type& get_allocator() const {
    return *const_cast<allocator_delete*>(this);
  }

  void operator()(pointer p) const {
    if (!p) return;
    const_cast<allocator_delete*>(this)->destroy(p);
    const_cast<allocator_delete*>(this)->deallocate(p, 1);
  }
};

template <typename T, typename Allocator>
class is_simple_allocator {
  FOLLY_CREATE_HAS_MEMBER_FN_TRAITS(has_destroy, destroy);

  typedef typename std::remove_const<
    typename std::remove_reference<Allocator>::type
  >::type allocator;
  typedef typename std::remove_reference<T>::type value_type;
  typedef value_type* pointer;

public:
  constexpr static bool value = !has_destroy<allocator, void(pointer)>::value
    && !has_destroy<allocator, void(void*)>::value;
};

template <typename T, typename Allocator>
struct as_stl_allocator {
  typedef typename std::conditional<
    is_simple_allocator<T, Allocator>::value,
    folly::StlAllocator<
      typename std::remove_reference<Allocator>::type,
      typename std::remove_reference<T>::type
    >,
    typename std::remove_reference<Allocator>::type
  >::type type;
};

template <typename T, typename Allocator>
typename std::enable_if<
  is_simple_allocator<T, Allocator>::value,
  folly::StlAllocator<
    typename std::remove_reference<Allocator>::type,
    typename std::remove_reference<T>::type
  >
>::type make_stl_allocator(Allocator&& allocator) {
  return folly::StlAllocator<
    typename std::remove_reference<Allocator>::type,
    typename std::remove_reference<T>::type
  >(&allocator);
}

template <typename T, typename Allocator>
typename std::enable_if<
  !is_simple_allocator<T, Allocator>::value,
  typename std::remove_reference<Allocator>::type
>::type make_stl_allocator(Allocator&& allocator) {
  return std::move(allocator);
}

/**
 * AllocatorUniquePtr: a unique_ptr that supports both STL-style
 * allocators and SimpleAllocator
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */

template <typename T, typename Allocator>
struct AllocatorUniquePtr {
  typedef std::unique_ptr<T,
    folly::allocator_delete<
      typename std::conditional<
        is_simple_allocator<T, Allocator>::value,
        folly::StlAllocator<typename std::remove_reference<Allocator>::type, T>,
        typename std::remove_reference<Allocator>::type
      >::type
    >
  > type;
};

/**
 * Functions to allocate a unique_ptr / shared_ptr, supporting both
 * STL-style allocators and SimpleAllocator, analog to std::allocate_shared
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */

template <typename T, typename Allocator, typename ...Args>
typename AllocatorUniquePtr<T, Allocator>::type allocate_unique(
  Allocator&& allocator, Args&&... args
) {
  auto stlAllocator = folly::make_stl_allocator<T>(
    std::forward<Allocator>(allocator)
  );
  auto p = stlAllocator.allocate(1);

  try {
    stlAllocator.construct(p, std::forward<Args>(args)...);

    return {p,
      folly::allocator_delete<decltype(stlAllocator)>(std::move(stlAllocator))
    };
  } catch (...) {
    stlAllocator.deallocate(p, 1);
    throw;
  }
}

template <typename T, typename Allocator, typename ...Args>
std::shared_ptr<T> allocate_shared(Allocator&& allocator, Args&&... args) {
  return std::allocate_shared<T>(
    folly::make_stl_allocator<T>(std::forward<Allocator>(allocator)),
    std::forward<Args>(args)...
  );
}

/**
 * IsArenaAllocator<T>::value describes whether SimpleAllocator has
 * no-op deallocate().
 */
template <class T> struct IsArenaAllocator : std::false_type { };

}  // namespace folly
