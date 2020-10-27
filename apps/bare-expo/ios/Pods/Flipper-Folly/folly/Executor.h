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

#include <cassert>
#include <climits>
#include <utility>

#include <folly/Function.h>
#include <folly/Optional.h>
#include <folly/Range.h>
#include <folly/Utility.h>

namespace folly {
namespace pushmi {
// derive from this for types that need to find operator|() overloads by ADL
struct folly_pipeorigin {};
} // namespace pushmi

using Func = Function<void()>;

namespace detail {

class ExecutorKeepAliveBase {
 public:
  //  A dummy keep-alive is a keep-alive to an executor which does not support
  //  the keep-alive mechanism.
  static constexpr uintptr_t kDummyFlag = uintptr_t(1) << 0;

  //  An alias keep-alive is a keep-alive to an executor to which there is
  //  known to be another keep-alive whose lifetime surrounds the lifetime of
  //  the alias.
  static constexpr uintptr_t kAliasFlag = uintptr_t(1) << 1;

  static constexpr uintptr_t kFlagMask = kDummyFlag | kAliasFlag;
  static constexpr uintptr_t kExecutorMask = ~kFlagMask;
};

} // namespace detail

/// An Executor accepts units of work with add(), which should be
/// threadsafe.
class Executor {
 public:
  // Workaround for a linkage problem with explicitly defaulted dtor t22914621
  virtual ~Executor() {}

  /// Enqueue a function to executed by this executor. This and all
  /// variants must be threadsafe.
  virtual void add(Func) = 0;

  /// Enqueue a function with a given priority, where 0 is the medium priority
  /// This is up to the implementation to enforce
  virtual void addWithPriority(Func, int8_t priority);

  virtual uint8_t getNumPriorities() const {
    return 1;
  }

  static const int8_t LO_PRI = SCHAR_MIN;
  static const int8_t MID_PRI = 0;
  static const int8_t HI_PRI = SCHAR_MAX;

  /**
   * Executor::KeepAlive is a safe pointer to an Executor.
   * For any Executor that supports KeepAlive functionality, Executor's
   * destructor will block until all the KeepAlive objects associated with that
   * Executor are destroyed.
   * For Executors that don't support the KeepAlive funcionality, KeepAlive
   * doesn't provide such protection.
   *
   * KeepAlive should *always* be used instead of Executor*. KeepAlive can be
   * implicitly constructed from Executor*. getKeepAliveToken() helper method
   * can be used to construct a KeepAlive in templated code if you need to
   * preserve the original Executor type.
   */
  template <typename ExecutorT = Executor>
  class KeepAlive : pushmi::folly_pipeorigin,
                    private detail::ExecutorKeepAliveBase {
   public:
    using KeepAliveFunc = Function<void(KeepAlive&&)>;

    KeepAlive() = default;

    ~KeepAlive() {
      reset();
    }

    KeepAlive(KeepAlive&& other) noexcept
        : storage_(std::exchange(other.storage_, 0)) {}

    KeepAlive(const KeepAlive& other) noexcept
        : KeepAlive(getKeepAliveToken(other.get())) {}

    template <
        typename OtherExecutor,
        typename = typename std::enable_if<
            std::is_convertible<OtherExecutor*, ExecutorT*>::value>::type>
    /* implicit */ KeepAlive(KeepAlive<OtherExecutor>&& other) noexcept
        : KeepAlive(other.get(), other.storage_ & kFlagMask) {
      other.storage_ = 0;
    }

    template <
        typename OtherExecutor,
        typename = typename std::enable_if<
            std::is_convertible<OtherExecutor*, ExecutorT*>::value>::type>
    /* implicit */ KeepAlive(const KeepAlive<OtherExecutor>& other) noexcept
        : KeepAlive(getKeepAliveToken(other.get())) {}

    /* implicit */ KeepAlive(ExecutorT* executor) {
      *this = getKeepAliveToken(executor);
    }

    KeepAlive& operator=(KeepAlive&& other) {
      reset();
      storage_ = std::exchange(other.storage_, 0);
      return *this;
    }

    KeepAlive& operator=(KeepAlive const& other) {
      return operator=(folly::copy(other));
    }

    template <
        typename OtherExecutor,
        typename = typename std::enable_if<
            std::is_convertible<OtherExecutor*, ExecutorT*>::value>::type>
    KeepAlive& operator=(KeepAlive<OtherExecutor>&& other) {
      return *this = KeepAlive(std::move(other));
    }

    template <
        typename OtherExecutor,
        typename = typename std::enable_if<
            std::is_convertible<OtherExecutor*, ExecutorT*>::value>::type>
    KeepAlive& operator=(const KeepAlive<OtherExecutor>& other) {
      return *this = KeepAlive(other);
    }

    void reset() {
      if (Executor* executor = get()) {
        auto const flags = std::exchange(storage_, 0) & kFlagMask;
        if (!(flags & (kDummyFlag | kAliasFlag))) {
          executor->keepAliveRelease();
        }
      }
    }

    explicit operator bool() const {
      return storage_;
    }

    ExecutorT* get() const {
      return reinterpret_cast<ExecutorT*>(storage_ & kExecutorMask);
    }

    ExecutorT& operator*() const {
      return *get();
    }

    ExecutorT* operator->() const {
      return get();
    }

    KeepAlive copy() const {
      return isKeepAliveDummy(*this) //
          ? makeKeepAliveDummy(get())
          : getKeepAliveToken(get());
    }

    KeepAlive get_alias() const {
      return KeepAlive(storage_ | kAliasFlag);
    }

    template <class KAF>
    void add(KAF&& f) && {
      static_assert(
          is_invocable<KAF, KeepAlive&&>::value,
          "Parameter to add must be void(KeepAlive&&)>");
      auto ex = get();
      ex->add([ka = std::move(*this), f = std::forward<KAF>(f)]() mutable {
        f(std::move(ka));
      });
    }

   private:
    friend class Executor;
    template <typename OtherExecutor>
    friend class KeepAlive;

    KeepAlive(ExecutorT* executor, uintptr_t flags) noexcept
        : storage_(reinterpret_cast<uintptr_t>(executor) | flags) {
      assert(executor);
      assert(!(reinterpret_cast<uintptr_t>(executor) & ~kExecutorMask));
      assert(!(flags & kExecutorMask));
    }

    explicit KeepAlive(uintptr_t storage) noexcept : storage_(storage) {}

    //  Combined storage for the executor pointer and for all flags.
    uintptr_t storage_{reinterpret_cast<uintptr_t>(nullptr)};
  };

  template <typename ExecutorT>
  static KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT* executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "getKeepAliveToken only works for folly::Executor implementations.");
    if (!executor) {
      return {};
    }
    folly::Executor* executorPtr = executor;
    if (executorPtr->keepAliveAcquire()) {
      return makeKeepAlive<ExecutorT>(executor);
    }
    return makeKeepAliveDummy<ExecutorT>(executor);
  }

  template <typename ExecutorT>
  static KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT& executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "getKeepAliveToken only works for folly::Executor implementations.");
    return getKeepAliveToken(&executor);
  }

 protected:
  /**
   * Returns true if the KeepAlive is constructed from an executor that does
   * not support the keep alive ref-counting functionality
   */
  template <typename ExecutorT>
  static bool isKeepAliveDummy(const KeepAlive<ExecutorT>& keepAlive) {
    return keepAlive.storage_ & KeepAlive<ExecutorT>::kDummyFlag;
  }

  // Acquire a keep alive token. Should return false if keep-alive mechanism
  // is not supported.
  virtual bool keepAliveAcquire();
  // Release a keep alive token previously acquired by keepAliveAcquire().
  // Will never be called if keepAliveAcquire() returns false.
  virtual void keepAliveRelease();

  template <typename ExecutorT>
  static KeepAlive<ExecutorT> makeKeepAlive(ExecutorT* executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "makeKeepAlive only works for folly::Executor implementations.");
    return KeepAlive<ExecutorT>{executor, uintptr_t(0)};
  }

 private:
  template <typename ExecutorT>
  static KeepAlive<ExecutorT> makeKeepAliveDummy(ExecutorT* executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "makeKeepAliveDummy only works for folly::Executor implementations.");
    return KeepAlive<ExecutorT>{executor, KeepAlive<ExecutorT>::kDummyFlag};
  }
};

/// Returns a keep-alive token which guarantees that Executor will keep
/// processing tasks until the token is released (if supported by Executor).
/// KeepAlive always contains a valid pointer to an Executor.
template <typename ExecutorT>
Executor::KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT* executor) {
  static_assert(
      std::is_base_of<Executor, ExecutorT>::value,
      "getKeepAliveToken only works for folly::Executor implementations.");
  return Executor::getKeepAliveToken(executor);
}

template <typename ExecutorT>
Executor::KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT& executor) {
  static_assert(
      std::is_base_of<Executor, ExecutorT>::value,
      "getKeepAliveToken only works for folly::Executor implementations.");
  return getKeepAliveToken(&executor);
}

template <typename ExecutorT>
Executor::KeepAlive<ExecutorT> getKeepAliveToken(
    Executor::KeepAlive<ExecutorT>& ka) {
  return ka.copy();
}

struct BlockingContext {
  folly::StringPiece executorName;
};

class BlockingGuard;

BlockingGuard makeBlockingDisallowedGuard(folly::StringPiece executorName);
BlockingGuard makeBlockingAllowedGuard();

class FOLLY_NODISCARD BlockingGuard {
 public:
  ~BlockingGuard();

 private:
  // Disallow blocking
  BlockingGuard(folly::StringPiece executorName);
  // Empty guard treated as temporarily allowing blocking
  BlockingGuard();

  friend BlockingGuard makeBlockingDisallowedGuard(
      folly::StringPiece executorName);
  friend BlockingGuard makeBlockingAllowedGuard();

  folly::Optional<BlockingContext> previousContext_;
};

folly::Optional<BlockingContext> getBlockingContext();

} // namespace folly
