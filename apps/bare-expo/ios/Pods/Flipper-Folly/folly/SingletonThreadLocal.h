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

#include <thread>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>

#include <folly/ScopeGuard.h>
#include <folly/ThreadLocal.h>
#include <folly/detail/Iterators.h>
#include <folly/detail/Singleton.h>
#include <folly/detail/UniqueInstance.h>
#include <folly/functional/Invoke.h>

// we do not want to use FOLLY_TLS here for mobile
#if !FOLLY_MOBILE && defined(FOLLY_TLS)
#define FOLLY_STL_USE_FOLLY_TLS 1
#else
#undef FOLLY_STL_USE_FOLLY_TLS
#endif

namespace folly {

/// SingletonThreadLocal
///
/// Useful for a per-thread leaky-singleton model in libraries and applications.
///
/// By "leaky" it is meant that the T instances held by the instantiation
/// SingletonThreadLocal<T> will survive until their owning thread exits.
/// Therefore, they can safely be used before main() begins and after main()
/// ends, and they can also safely be used in an application that spawns many
/// temporary threads throughout its life.
///
/// Example:
///
///   struct UsefulButHasExpensiveCtor {
///     UsefulButHasExpensiveCtor(); // this is expensive
///     Result operator()(Arg arg);
///   };
///
///   Result useful(Arg arg) {
///     using Useful = UsefulButHasExpensiveCtor;
///     auto& useful = folly::SingletonThreadLocal<Useful>::get();
///     return useful(arg);
///   }
///
/// As an example use-case, the random generators in <random> are expensive to
/// construct. And their constructors are deterministic, but many cases require
/// that they be randomly seeded. So folly::Random makes good canonical uses of
/// folly::SingletonThreadLocal so that a seed is computed from the secure
/// random device once per thread, and the random generator is constructed with
/// the seed once per thread.
///
/// Keywords to help people find this class in search:
/// Thread Local Singleton ThreadLocalSingleton
template <
    typename T,
    typename Tag = detail::DefaultTag,
    typename Make = detail::DefaultMake<T>,
    typename TLTag = std::
        conditional_t<std::is_same<Tag, detail::DefaultTag>::value, void, Tag>>
class SingletonThreadLocal {
 private:
  static detail::UniqueInstance unique;

  struct Wrapper;

  struct LocalCache {
    Wrapper* cache;
  };
  static_assert(std::is_pod<LocalCache>::value, "non-pod");

  struct LocalLifetime;

  struct Wrapper {
    using Object = invoke_result_t<Make>;
    static_assert(std::is_convertible<Object&, T&>::value, "inconvertible");

    using LocalCacheSet = std::unordered_set<LocalCache*>;

    // keep as first field, to save 1 instr in the fast path
    Object object{Make{}()};

    // per-cache refcounts, the number of lifetimes tracking that cache
    std::unordered_map<LocalCache*, size_t> caches;

    // per-lifetime cache tracking; 1-M lifetimes may track 1-N caches
    std::unordered_map<LocalLifetime*, LocalCacheSet> lifetimes;

    /* implicit */ operator T&() {
      return object;
    }

    ~Wrapper() {
      for (auto& kvp : caches) {
        kvp.first->cache = nullptr;
      }
    }
  };

  using WrapperTL = ThreadLocal<Wrapper, TLTag>;

  struct LocalLifetime {
    ~LocalLifetime() {
      auto& wrapper = getWrapper();
      auto& lifetimes = wrapper.lifetimes[this];
      for (auto cache : lifetimes) {
        auto const it = wrapper.caches.find(cache);
        if (!--it->second) {
          wrapper.caches.erase(it);
          cache->cache = nullptr;
        }
      }
      wrapper.lifetimes.erase(this);
    }

    void track(LocalCache& cache) {
      auto& wrapper = getWrapper();
      cache.cache = &wrapper;
      auto const inserted = wrapper.lifetimes[this].insert(&cache);
      wrapper.caches[&cache] += inserted.second;
    }
  };

  SingletonThreadLocal() = delete;

  FOLLY_ALWAYS_INLINE static WrapperTL& getWrapperTL() {
    return detail::createGlobal<WrapperTL, Tag>();
  }

  FOLLY_NOINLINE static Wrapper& getWrapper() {
    (void)unique; // force the object not to be thrown out as unused
    return *getWrapperTL();
  }

#ifdef FOLLY_STL_USE_FOLLY_TLS
  FOLLY_NOINLINE static Wrapper& getSlow(LocalCache& cache) {
    if (threadlocal_detail::StaticMetaBase::dying()) {
      return getWrapper();
    }
    static thread_local LocalLifetime lifetime;
    lifetime.track(cache); // idempotent
    return FOLLY_LIKELY(!!cache.cache) ? *cache.cache : getWrapper();
  }
#endif

 public:
  FOLLY_EXPORT FOLLY_ALWAYS_INLINE static T& get() {
#ifdef FOLLY_STL_USE_FOLLY_TLS
    static thread_local LocalCache cache;
    return FOLLY_LIKELY(!!cache.cache) ? *cache.cache : getSlow(cache);
#else
    return getWrapper();
#endif
  }

  class Accessor {
   private:
    using Inner = typename WrapperTL::Accessor;
    using IteratorBase = typename Inner::Iterator;
    using IteratorTag = std::bidirectional_iterator_tag;

    Inner inner_;

    explicit Accessor(Inner inner) noexcept : inner_(std::move(inner)) {}

   public:
    friend class SingletonThreadLocal<T, Tag, Make, TLTag>;

    class Iterator
        : public detail::
              IteratorAdaptor<Iterator, IteratorBase, T, IteratorTag> {
     private:
      using Super =
          detail::IteratorAdaptor<Iterator, IteratorBase, T, IteratorTag>;
      using Super::Super;

     public:
      friend class Accessor;

      T& dereference() const {
        return const_cast<Iterator*>(this)->base()->object;
      }

      std::thread::id getThreadId() const {
        return this->base().getThreadId();
      }

      uint64_t getOSThreadId() const {
        return this->base().getOSThreadId();
      }
    };

    Accessor(const Accessor&) = delete;
    Accessor& operator=(const Accessor&) = delete;
    Accessor(Accessor&&) = default;
    Accessor& operator=(Accessor&&) = default;

    Iterator begin() const {
      return Iterator(inner_.begin());
    }

    Iterator end() const {
      return Iterator(inner_.end());
    }
  };

  // Must use a unique Tag, takes a lock that is one per Tag
  static Accessor accessAllThreads() {
    return Accessor(getWrapperTL().accessAllThreads());
  }
};

template <typename T, typename Tag, typename Make, typename TLTag>
detail::UniqueInstance SingletonThreadLocal<T, Tag, Make, TLTag>::unique{
    "folly::SingletonThreadLocal",
    tag_t<T, Tag>{},
    tag_t<Make, TLTag>{}};

} // namespace folly

/// FOLLY_DECLARE_REUSED
///
/// Useful for local variables of container types, where it is desired to avoid
/// the overhead associated with the local variable entering and leaving scope.
/// Rather, where it is desired that the memory be reused between invocations
/// of the same scope in the same thread rather than deallocated and reallocated
/// between invocations of the same scope in the same thread. Note that the
/// container will always be cleared between invocations; it is only the backing
/// memory allocation which is reused.
///
/// Example:
///
///   void traverse_perform(int root);
///   template <typename F>
///   void traverse_each_child_r(int root, F const&);
///   void traverse_depthwise(int root) {
///     // preserves some of the memory backing these per-thread data structures
///     FOLLY_DECLARE_REUSED(seen, std::unordered_set<int>);
///     FOLLY_DECLARE_REUSED(work, std::vector<int>);
///     // example algorithm that uses these per-thread data structures
///     work.push_back(root);
///     while (!work.empty()) {
///       root = work.back();
///       work.pop_back();
///       seen.insert(root);
///       traverse_perform(root);
///       traverse_each_child_r(root, [&](int item) {
///         if (!seen.count(item)) {
///           work.push_back(item);
///         }
///       });
///     }
///   }
#define FOLLY_DECLARE_REUSED(name, ...)                                        \
  struct __folly_reused_type_##name {                                          \
    __VA_ARGS__ object;                                                        \
  };                                                                           \
  auto& name =                                                                 \
      ::folly::SingletonThreadLocal<__folly_reused_type_##name>::get().object; \
  auto __folly_reused_g_##name = ::folly::makeGuard([&] { name.clear(); })
