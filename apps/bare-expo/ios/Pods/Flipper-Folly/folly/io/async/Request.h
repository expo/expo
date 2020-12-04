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

#include <folly/Synchronized.h>
#include <folly/container/F14Map.h>
#include <folly/portability/GFlags.h>
#include <folly/sorted_vector_types.h>
#include <folly/synchronization/Hazptr.h>

#include <atomic>
#include <memory>
#include <mutex>
#include <string>

DECLARE_bool(folly_reqctx_use_hazptr);

namespace folly {

/*
 * A token to be used to fetch data from RequestContext.
 * Generally you will want this to be a static, created only once using a
 * string, and then only copied. The string constructor is expensive.
 */
class RequestToken {
 public:
  RequestToken() = default;
  explicit RequestToken(const std::string& str);

  bool operator==(const RequestToken& other) const {
    return token_ == other.token_;
  }

  // Slow, use only for debug log messages.
  std::string getDebugString() const;

  friend struct std::hash<folly::RequestToken>;

 private:
  static Synchronized<F14FastMap<std::string, uint32_t>>& getCache();

  uint32_t token_;
};

} // namespace folly

namespace std {
template <>
struct hash<folly::RequestToken> {
  size_t operator()(const folly::RequestToken& token) const {
    return hash<uint32_t>()(token.token_);
  }
};
} // namespace std

namespace folly {

// - A runtime flag GFLAGS_reqctx_use_hazptr determines the
//   implementation of RequestContext.
// - The flag false implementation uses sequential data structures
//   protected by a read-write lock.
// - The flag true implementation uses single-writer multi-readers
//   data structures protected by hazard pointers for readers and a
//   lock for writers.
// - Each RequestContext instances contains a bool member useHazptr_
//   (readable by a public member function useHazptr()) that indicates
//   the implementation of the instance depending on the value of the
//   GFLAG at instance construction time..

// Some request context that follows an async request through a process
// Everything in the context must be thread safe

class RequestData {
 public:
  virtual ~RequestData() = default;

  // Avoid calling RequestContext::setContextData, setContextDataIfAbsent, or
  // clearContextData from these callbacks. Doing so will cause deadlock. We
  // could fix these deadlocks, but only at significant performance penalty, so
  // just don't do it!

  // hasCallback() applies only to onSet() and onUnset().
  // onClear() is always executed exactly once.
  virtual bool hasCallback() = 0;
  // Callback executed when setting RequestContext. Make sure your RequestData
  // instance overrides the hasCallback method to return true otherwise
  // the callback will not be executed
  virtual void onSet() {}
  // Callback executed when unsetting RequestContext. Make sure your RequestData
  // instance overrides the hasCallback method to return true otherwise
  // the callback will not be executed
  virtual void onUnset() {}
  // Callback executed exactly once upon the release of the last
  // reference to the request data (as a result of either a call to
  // clearContextData or the destruction of a request context that
  // contains a reference to the data). It can be overridden in
  // derived classes. There may be concurrent executions of onSet()
  // and onUnset() with that of onClear().
  virtual void onClear() {}
  // For debugging
  int refCount() {
    return keepAliveCounter_.load(std::memory_order_acquire);
  }

 private:
  // Start shallow copy implementation details:
  // For efficiency, RequestContext provides a raw ptr interface.
  // To support shallow copy, we need a shared ptr.
  // To keep it as safe as possible (even if a raw ptr is passed back),
  // the counter lives directly in RequestData.

  friend class RequestContext;

  static constexpr int kDeleteCount = 0x1;
  static constexpr int kClearCount = 0x1000;

  // Reference-counting functions used by the hazptr-based implementation.
  // Increment the reference count
  void acquireRef();
  // Decrement the reference count. Clear only if last.
  void releaseRefClearOnly();
  // Decrement the reference count. Delete only if last.
  void releaseRefDeleteOnly();
  // Decrement the reference count. Clear and delete if last.
  void releaseRefClearDelete();

  // Unique ptr with custom destructor, decrement the counter
  // and only free if 0
  struct DestructPtr {
    void operator()(RequestData* ptr);
  };
  struct SharedPtr : public std::unique_ptr<RequestData, DestructPtr> {
    SharedPtr() = default;
    using std::unique_ptr<RequestData, DestructPtr>::unique_ptr;
    SharedPtr(const SharedPtr& other) : SharedPtr(constructPtr(other.get())) {}
    SharedPtr& operator=(const SharedPtr& other) {
      return operator=(constructPtr(other.get()));
    }
    SharedPtr(SharedPtr&&) = default;
    SharedPtr& operator=(SharedPtr&&) = default;
  };

  // Initialize the pseudo-shared ptr, increment the counter
  static SharedPtr constructPtr(RequestData* ptr);

  std::atomic<int> keepAliveCounter_{0};
  // End shallow copy
};

// If you do not call create() to create a unique request context,
// this default request context will always be returned, and is never
// copied between threads.
class RequestContext {
 public:
  RequestContext();
  RequestContext(RequestContext&& ctx) = delete;
  RequestContext& operator=(const RequestContext&) = delete;
  RequestContext& operator=(RequestContext&&) = delete;

  // copy ctor is disabled, use copyAsRoot/copyAsChild instead.
  static std::shared_ptr<RequestContext> copyAsRoot(
      const RequestContext& ctx,
      intptr_t rootid);
  static std::shared_ptr<RequestContext> copyAsChild(const RequestContext& ctx);

  // Create a unique request context for this request.
  // It will be passed between queues / threads (where implemented),
  // so it should be valid for the lifetime of the request.
  static void create() {
    setContext(std::make_shared<RequestContext>());
  }

  // Get the current context.
  static RequestContext* get();

  intptr_t getRootId() const {
    return rootId_;
  }

  struct RootIdInfo {
    intptr_t id;
    std::thread::id tid;
    uint64_t tidOS;
  };
  static std::vector<RootIdInfo> getRootIdsFromAllThreads();

  // The following APIs are used to add, remove and access RequestData instance
  // in the RequestContext instance, normally used for per-RequestContext
  // tracking or callback on set and unset. These APIs are Thread-safe.
  // These APIs are performance sensitive, so please ask if you need help
  // profiling any use of these APIs.

  // Add RequestData instance "data" to this RequestContext instance, with
  // string identifier "val". If the same string identifier has already been
  // used, will print a warning message for the first time, clear the existing
  // RequestData instance for "val", and **not** add "data".
  void setContextData(
      const RequestToken& token,
      std::unique_ptr<RequestData> data);
  void setContextData(
      const std::string& val,
      std::unique_ptr<RequestData> data) {
    setContextData(RequestToken(val), std::move(data));
  }

  // Add RequestData instance "data" to this RequestContext instance, with
  // string identifier "val". If the same string identifier has already been
  // used, return false and do nothing. Otherwise add "data" and return true.
  bool setContextDataIfAbsent(
      const RequestToken& token,
      std::unique_ptr<RequestData> data);
  bool setContextDataIfAbsent(
      const std::string& val,
      std::unique_ptr<RequestData> data) {
    return setContextDataIfAbsent(RequestToken(val), std::move(data));
  }

  // Remove the RequestData instance with string identifier "val", if it exists.
  void clearContextData(const RequestToken& val);
  void clearContextData(const std::string& val) {
    clearContextData(RequestToken(val));
  }

  // Returns true if and only if the RequestData instance with string identifier
  // "val" exists in this RequestContext instnace.
  bool hasContextData(const RequestToken& val) const;
  bool hasContextData(const std::string& val) const {
    return hasContextData(RequestToken(val));
  }

  // Get (constant) raw pointer of the RequestData instance with string
  // identifier "val" if it exists, otherwise returns null pointer.
  RequestData* getContextData(const RequestToken& val);
  const RequestData* getContextData(const RequestToken& val) const;
  RequestData* getContextData(const std::string& val) {
    return getContextData(RequestToken(val));
  }
  const RequestData* getContextData(const std::string& val) const {
    return getContextData(RequestToken(val));
  }

  void onSet();
  void onUnset();

  // useHazptr
  FOLLY_ALWAYS_INLINE bool useHazptr() const {
    return useHazptr_;
  }

  // The following API is used to pass the context through queues / threads.
  // saveContext is called to get a shared_ptr to the context, and
  // setContext is used to reset it on the other side of the queue.
  //
  // Whenever possible, use RequestContextScopeGuard instead of setContext
  // to make sure that RequestContext is reset to the original value when
  // we exit the scope.
  //
  // A shared_ptr is used, because many request may fan out across
  // multiple threads, or do post-send processing, etc.
  static std::shared_ptr<RequestContext> setContext(
      std::shared_ptr<RequestContext> const& ctx);
  static std::shared_ptr<RequestContext> setContext(
      std::shared_ptr<RequestContext>&& newCtx_);

  static std::shared_ptr<RequestContext> saveContext() {
    return getStaticContext().first;
  }

 private:
  struct Tag {};
  RequestContext(const RequestContext& ctx) = default;

 public:
  RequestContext(const RequestContext& ctx, intptr_t rootid, Tag tag);
  RequestContext(const RequestContext& ctx, Tag tag);
  explicit RequestContext(intptr_t rootId);
  using StaticContext = std::pair<std::shared_ptr<RequestContext>, intptr_t>;

 private:
  static StaticContext& getStaticContext();

  static std::shared_ptr<RequestContext> setContextLock(
      std::shared_ptr<RequestContext>& newCtx,
      StaticContext& staticCtx);
  static std::shared_ptr<RequestContext> setContextHazptr(
      std::shared_ptr<RequestContext>& newCtx,
      StaticContext& staticCtx);

  // Start shallow copy guard implementation details:
  // All methods are private to encourage proper use
  friend struct ShallowCopyRequestContextScopeGuard;

  // This sets a shallow copy of the current context as current,
  // then return the previous context (so it can be reset later).
  static std::shared_ptr<RequestContext> setShallowCopyContext();

  // Similar to setContextData, except it overwrites the data
  // if already set (instead of warn + reset ptr).
  void overwriteContextDataLock(
      const RequestToken& token,
      std::unique_ptr<RequestData> data);
  void overwriteContextDataLock(
      const std::string& val,
      std::unique_ptr<RequestData> data) {
    overwriteContextDataLock(RequestToken(val), std::move(data));
  }
  // End shallow copy guard

  // For functions with a parameter safe, if safe is true then the
  // caller guarantees that there are no concurrent readers or writers
  // accessing the structure.
  void overwriteContextDataHazptr(
      const RequestToken& token,
      std::unique_ptr<RequestData> data,
      bool safe = false);
  void overwriteContextDataHazptr(
      const std::string& val,
      std::unique_ptr<RequestData> data,
      bool safe = false) {
    overwriteContextDataHazptr(RequestToken(val), std::move(data), safe);
  }

  enum class DoSetBehaviour {
    SET,
    SET_IF_ABSENT,
    OVERWRITE,
  };

  bool doSetContextDataLock(
      const RequestToken& token,
      std::unique_ptr<RequestData>& data,
      DoSetBehaviour behaviour);
  bool doSetContextDataLock(
      const std::string& val,
      std::unique_ptr<RequestData>& data,
      DoSetBehaviour behaviour) {
    return doSetContextDataLock(RequestToken(val), data, behaviour);
  }

  bool doSetContextDataHazptr(
      const RequestToken& token,
      std::unique_ptr<RequestData>& data,
      DoSetBehaviour behaviour,
      bool safe = false);
  bool doSetContextDataHazptr(
      const std::string& val,
      std::unique_ptr<RequestData>& data,
      DoSetBehaviour behaviour,
      bool safe = false) {
    return doSetContextDataHazptr(RequestToken(val), data, behaviour, safe);
  }

  // State immplementation with sequential data structures protected by a
  // read-write locks.
  struct State {
    // This must be optimized for lookup, its hot path is getContextData
    // Efficiency of copying the container also matters in setShallowCopyContext
    F14FastMap<RequestToken, RequestData::SharedPtr> requestData_;
    // This must be optimized for iteration, its hot path is setContext
    // We also use the fact that it's ordered to efficiently compute
    // the difference with previous context
    sorted_vector_set<RequestData*> callbackData_;
  };
  folly::Synchronized<State> state_;

  // State implementation with single-writer multi-reader data
  // structures protected by hazard pointers for readers and a lock
  // for writers.
  struct StateHazptr {
    // Hazard pointer-protected combined structure for request data
    // and callbacks.
    struct Combined;
    hazptr_obj_cohort<> cohort_; // For destruction order
    std::atomic<Combined*> combined_{nullptr};
    std::mutex mutex_;

    StateHazptr();
    StateHazptr(const StateHazptr& o);
    StateHazptr(StateHazptr&&) = delete;
    StateHazptr& operator=(const StateHazptr&) = delete;
    StateHazptr& operator=(StateHazptr&&) = delete;
    ~StateHazptr();

   private:
    friend class RequestContext;

    struct SetContextDataResult {
      bool changed; // Changes were made
      bool unexpected; // Update was unexpected
      Combined* replaced; // The combined structure was replaced
    };

    Combined* combined() const;
    Combined* ensureCombined(); // Lazy allocation if needed
    void setCombined(Combined* p);
    Combined* expand(Combined* combined);
    bool doSetContextData(
        const RequestToken& token,
        std::unique_ptr<RequestData>& data,
        DoSetBehaviour behaviour,
        bool safe);
    bool hasContextData(const RequestToken& token) const;
    RequestData* getContextData(const RequestToken& token);
    const RequestData* getContextData(const RequestToken& token) const;
    void onSet();
    void onUnset();
    void clearContextData(const RequestToken& token);
    SetContextDataResult doSetContextDataHelper(
        const RequestToken& token,
        std::unique_ptr<RequestData>& data,
        DoSetBehaviour behaviour,
        bool safe);
    Combined* eraseOldData(
        Combined* cur,
        const RequestToken& token,
        RequestData* oldData,
        bool safe);
    Combined* insertNewData(
        Combined* cur,
        const RequestToken& token,
        std::unique_ptr<RequestData>& data,
        bool found);
  }; // StateHazptr
  StateHazptr stateHazptr_;
  bool useHazptr_;
  // Shallow copies keep a note of the root context
  intptr_t rootId_;
};

/**
 * Note: you probably want to use ShallowCopyRequestContextScopeGuard
 * This resets all other RequestData for the duration of the scope!
 */
class RequestContextScopeGuard {
 private:
  std::shared_ptr<RequestContext> prev_;

 public:
  RequestContextScopeGuard(const RequestContextScopeGuard&) = delete;
  RequestContextScopeGuard& operator=(const RequestContextScopeGuard&) = delete;
  RequestContextScopeGuard(RequestContextScopeGuard&&) = delete;
  RequestContextScopeGuard& operator=(RequestContextScopeGuard&&) = delete;

  // Create a new RequestContext and reset to the original value when
  // this goes out of scope.
  RequestContextScopeGuard() : prev_(RequestContext::saveContext()) {
    RequestContext::create();
  }

  // Set a RequestContext that was previously captured by saveContext(). It will
  // be automatically reset to the original value when this goes out of scope.
  explicit RequestContextScopeGuard(std::shared_ptr<RequestContext> const& ctx)
      : prev_(RequestContext::setContext(ctx)) {}
  explicit RequestContextScopeGuard(std::shared_ptr<RequestContext>&& ctx)
      : prev_(RequestContext::setContext(std::move(ctx))) {}

  ~RequestContextScopeGuard() {
    RequestContext::setContext(std::move(prev_));
  }
};

/**
 * This guard maintains all the RequestData pointers of the parent.
 * This allows to overwrite a specific RequestData pointer for the
 * scope's duration, without breaking others.
 *
 * Only modified pointers will have their set/onset methods called
 */
struct ShallowCopyRequestContextScopeGuard {
  ShallowCopyRequestContextScopeGuard()
      : prev_(RequestContext::setShallowCopyContext()) {}

  /**
   * Shallow copy then overwrite one specific RequestData
   *
   * Helper constructor which is a more efficient equivalent to
   * "clearRequestData" then "setRequestData" after the guard.
   */
  ShallowCopyRequestContextScopeGuard(
      const RequestToken& token,
      std::unique_ptr<RequestData> data)
      : ShallowCopyRequestContextScopeGuard() {
    auto ctx = RequestContext::get();
    if (ctx->useHazptr()) {
      ctx->overwriteContextDataHazptr(token, std::move(data), true);
    } else {
      ctx->overwriteContextDataLock(token, std::move(data));
    }
  }
  ShallowCopyRequestContextScopeGuard(
      const std::string& val,
      std::unique_ptr<RequestData> data)
      : ShallowCopyRequestContextScopeGuard() {
    auto ctx = RequestContext::get();
    if (ctx->useHazptr()) {
      ctx->overwriteContextDataHazptr(val, std::move(data), true);
    } else {
      ctx->overwriteContextDataLock(val, std::move(data));
    }
  }

  ~ShallowCopyRequestContextScopeGuard() {
    RequestContext::setContext(std::move(prev_));
  }

  ShallowCopyRequestContextScopeGuard(
      const ShallowCopyRequestContextScopeGuard&) = delete;
  ShallowCopyRequestContextScopeGuard& operator=(
      const ShallowCopyRequestContextScopeGuard&) = delete;
  ShallowCopyRequestContextScopeGuard(ShallowCopyRequestContextScopeGuard&&) =
      delete;
  ShallowCopyRequestContextScopeGuard& operator=(
      ShallowCopyRequestContextScopeGuard&&) = delete;

 private:
  std::shared_ptr<RequestContext> prev_;
};

} // namespace folly
