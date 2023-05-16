#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "ReanimatedRuntime.h"
#include "RuntimeManager.h"
#include "Scheduler.h"

using namespace facebook;

namespace reanimated {

class JSRuntimeHelper;

// Core functions are not allowed to capture outside variables, otherwise they'd
// try to access _closure variable which is something we want to avoid for
// simplicity reasons.
class CoreFunction {
 private:
  std::unique_ptr<jsi::Function> rnFunction_;
  std::unique_ptr<jsi::Function> uiFunction_;
  std::string functionBody_;
  std::string location_;
  JSRuntimeHelper
      *runtimeHelper_; // runtime helper holds core function references, so we
                       // use normal pointer here to avoid ref cycles.
  std::unique_ptr<jsi::Function> &getFunction(jsi::Runtime &rt);

 public:
  CoreFunction(JSRuntimeHelper *runtimeHelper, const jsi::Value &workletObject);
  template <typename... Args>
  jsi::Value call(jsi::Runtime &rt, Args &&...args) {
    return getFunction(rt)->call(rt, args...);
  }
};

class JSRuntimeHelper {
 private:
  jsi::Runtime *rnRuntime_; // React-Native's main JS runtime
  jsi::Runtime *uiRuntime_; // UI runtime created by Reanimated
  std::shared_ptr<Scheduler> scheduler_;

 public:
  JSRuntimeHelper(
      jsi::Runtime *rnRuntime,
      jsi::Runtime *uiRuntime,
      const std::shared_ptr<Scheduler> &scheduler)
      : rnRuntime_(rnRuntime), uiRuntime_(uiRuntime), scheduler_(scheduler) {}

  volatile bool uiRuntimeDestroyed = false;
  std::unique_ptr<CoreFunction> callGuard;
  std::unique_ptr<CoreFunction> valueUnpacker;

  inline jsi::Runtime *uiRuntime() const {
    return uiRuntime_;
  }

  inline jsi::Runtime *rnRuntime() const {
    return rnRuntime_;
  }

  inline bool isUIRuntime(const jsi::Runtime &rt) const {
    return &rt == uiRuntime_;
  }

  inline bool isRNRuntime(const jsi::Runtime &rt) const {
    return &rt == rnRuntime_;
  }

  void scheduleOnUI(std::function<void()> job) {
    scheduler_->scheduleOnUI(job);
  }

  void scheduleOnJS(std::function<void()> job) {
    scheduler_->scheduleOnJS(job);
  }

  template <typename... Args>
  inline void runOnUIGuarded(const jsi::Value &function, Args &&...args) {
    // We only use callGuard in debug mode, otherwise we call the provided
    // function directly. CallGuard provides a way of capturing exceptions in
    // JavaScript and propagating them to the main React Native thread such that
    // they can be presented using RN's LogBox.
    jsi::Runtime &rt = *uiRuntime_;
#ifdef DEBUG
    callGuard->call(rt, function, args...);
#else
    function.asObject(rt).asFunction(rt).call(rt, args...);
#endif
  }
};

class Shareable {
 protected:
  virtual jsi::Value toJSValue(jsi::Runtime &rt) = 0;

 public:
  virtual ~Shareable();

  enum ValueType {
    UndefinedType,
    NullType,
    BooleanType,
    NumberType,
    // SymbolType, TODO
    // BigIntType, TODO
    StringType,
    ObjectType,
    ArrayType,
    WorkletType,
    RemoteFunctionType,
    HandleType,
    SynchronizedDataHolder,
    HostObjectType,
  };

  explicit Shareable(ValueType valueType) : valueType_(valueType) {}
  virtual jsi::Value getJSValue(jsi::Runtime &rt) {
    return toJSValue(rt);
  }

  inline ValueType valueType() const {
    return valueType_;
  }

  static std::shared_ptr<Shareable> undefined();

 protected:
  ValueType valueType_;
};

template <typename BaseClass>
class RetainingShareable : virtual public BaseClass {
 private:
  std::shared_ptr<JSRuntimeHelper> runtimeHelper_;
  std::unique_ptr<jsi::Value> remoteValue_;

 public:
  template <typename... Args>
  RetainingShareable(
      const std::shared_ptr<JSRuntimeHelper> &runtimeHelper,
      Args &&...args)
      : BaseClass(std::forward<Args>(args)...), runtimeHelper_(runtimeHelper) {}
  jsi::Value getJSValue(jsi::Runtime &rt) {
    if (runtimeHelper_->isRNRuntime(rt)) {
      // TODO: it is suboptimal to generate new object every time getJS is
      // called on host runtime – the objects we are generating already exists
      // and we should possibly just grab a hold of such object and use it here
      // instead of creating a new JS representation. As far as I understand the
      // only case where it can be realistically called this way is when a
      // shared value is created and then accessed on the same runtime
      return BaseClass::toJSValue(rt);
    } else if (remoteValue_ == nullptr) {
      auto value = BaseClass::toJSValue(rt);
      remoteValue_ = std::make_unique<jsi::Value>(rt, value);
      return value;
    }
    return jsi::Value(rt, *remoteValue_);
  }
  ~RetainingShareable() {
    if (runtimeHelper_->uiRuntimeDestroyed) {
      // The below use of unique_ptr.release prevents the smart pointer from
      // calling the destructor of the kept object. This effectively results in
      // leaking some memory. We do this on purpose, as sometimes we would keep
      // references to JSI objects past the lifetime of its runtime (e.g.,
      // shared values references from the RN VM holds reference to JSI objects
      // on the UI runtime). When the UI runtime is terminated, the orphaned JSI
      // objects would crash the app when their destructors are called, because
      // they call into a memory that's managed by the terminated runtime. We
      // accept the tradeoff of leaking memory here, as it has a limited impact.
      // This scenario can only occur when the React instance is torn down which
      // happens in development mode during app reloads, or in production when
      // the app is being shut down gracefully by the system. An alternative
      // solution would require us to keep track of all JSI values that are in
      // use which would require additional data structure and compute spent on
      // bookkeeping that only for the sake of destroying the values in time
      // before the runtime is terminated. Note that the underlying memory that
      // jsi::Value refers to is managed by the VM and gets freed along with the
      // runtime.
      remoteValue_.release();
    }
  }
};

class ShareableJSRef : public jsi::HostObject {
 private:
  std::shared_ptr<Shareable> value_;

 public:
  explicit ShareableJSRef(std::shared_ptr<Shareable> value) : value_(value) {}
  std::shared_ptr<Shareable> value() const {
    return value_;
  }

  static jsi::Object newHostObject(
      jsi::Runtime &rt,
      const std::shared_ptr<Shareable> &value) {
    return jsi::Object::createFromHostObject(
        rt, std::make_shared<ShareableJSRef>(value));
  }
};

std::shared_ptr<Shareable> extractShareableOrThrow(
    jsi::Runtime &rt,
    const jsi::Value &maybeShareableValue,
    const char *errorMessage = nullptr);

template <typename T>
std::shared_ptr<T> extractShareableOrThrow(
    jsi::Runtime &rt,
    const jsi::Value &shareableRef,
    const char *errorMessage = nullptr) {
  auto res = std::dynamic_pointer_cast<T>(
      extractShareableOrThrow(rt, shareableRef, errorMessage));
  if (!res) {
    throw new std::runtime_error(
        errorMessage != nullptr
            ? errorMessage
            : "provided shareable object is of an incompatible type");
  }
  return res;
}

class ShareableArray : public Shareable {
 public:
  ShareableArray(jsi::Runtime &rt, const jsi::Array &array);

  jsi::Value toJSValue(jsi::Runtime &rt) override {
    auto size = data_.size();
    auto ary = jsi::Array(rt, size);
    for (size_t i = 0; i < size; i++) {
      ary.setValueAtIndex(rt, i, data_[i]->getJSValue(rt));
    }
    return ary;
  }

 protected:
  std::vector<std::shared_ptr<Shareable>> data_;
};

class ShareableObject : public Shareable {
 public:
  ShareableObject(jsi::Runtime &rt, const jsi::Object &object);
  jsi::Value toJSValue(jsi::Runtime &rt) override {
    auto obj = jsi::Object(rt);
    for (size_t i = 0, size = data_.size(); i < size; i++) {
      obj.setProperty(
          rt, data_[i].first.c_str(), data_[i].second->getJSValue(rt));
    }
    return obj;
  }

 protected:
  std::vector<std::pair<std::string, std::shared_ptr<Shareable>>> data_;
};

class ShareableHostObject : public Shareable {
 public:
  ShareableHostObject(
      const std::shared_ptr<JSRuntimeHelper> &runtimeHelper,
      jsi::Runtime &rt,
      const std::shared_ptr<jsi::HostObject> &hostObject)
      : Shareable(HostObjectType), hostObject_(hostObject) {}
  jsi::Value toJSValue(jsi::Runtime &rt) override {
    return jsi::Object::createFromHostObject(rt, hostObject_);
  }

 protected:
  std::shared_ptr<jsi::HostObject> hostObject_;
};

class ShareableWorklet : public ShareableObject {
 private:
  std::shared_ptr<JSRuntimeHelper> runtimeHelper_;

 public:
  ShareableWorklet(
      const std::shared_ptr<JSRuntimeHelper> &runtimeHelper,
      jsi::Runtime &rt,
      const jsi::Object &worklet)
      : ShareableObject(rt, worklet), runtimeHelper_(runtimeHelper) {
    valueType_ = WorkletType;
  }
  jsi::Value toJSValue(jsi::Runtime &rt) override {
    jsi::Value obj = ShareableObject::toJSValue(rt);
    return runtimeHelper_->valueUnpacker->call(rt, obj);
  }
};

class ShareableRemoteFunction
    : public Shareable,
      public std::enable_shared_from_this<ShareableRemoteFunction> {
 private:
  jsi::Function function_;
  std::shared_ptr<JSRuntimeHelper> runtimeHelper_;

 public:
  ShareableRemoteFunction(
      const std::shared_ptr<JSRuntimeHelper> &runtimeHelper,
      jsi::Runtime &rt,
      jsi::Function &&function)
      : Shareable(RemoteFunctionType),
        function_(std::move(function)),
        runtimeHelper_(runtimeHelper) {}
  jsi::Value toJSValue(jsi::Runtime &rt) override {
    if (runtimeHelper_->isUIRuntime(rt)) {
#ifdef DEBUG
      return runtimeHelper_->valueUnpacker->call(
          rt,
          ShareableJSRef::newHostObject(rt, shared_from_this()),
          jsi::String::createFromAscii(rt, "RemoteFunction"));
#else
      return ShareableJSRef::newHostObject(rt, shared_from_this());
#endif
    } else {
      return jsi::Value(rt, function_);
    }
  }
};

class ShareableHandle : public Shareable {
 private:
  std::shared_ptr<JSRuntimeHelper> runtimeHelper_;
  std::unique_ptr<ShareableObject> initializer_;
  std::unique_ptr<jsi::Value> remoteValue_;

 public:
  ShareableHandle(
      const std::shared_ptr<JSRuntimeHelper> runtimeHelper,
      jsi::Runtime &rt,
      const jsi::Object &initializerObject)
      : Shareable(HandleType), runtimeHelper_(runtimeHelper) {
    initializer_ = std::make_unique<ShareableObject>(rt, initializerObject);
  }
  ~ShareableHandle() {
    if (runtimeHelper_->uiRuntimeDestroyed) {
      // The below use of unique_ptr.release prevents the smart pointer from
      // calling the destructor of the kept object. This effectively results in
      // leaking some memory. We do this on purpose, as sometimes we would keep
      // references to JSI objects past the lifetime of its runtime (e.g.,
      // shared values references from the RN VM holds reference to JSI objects
      // on the UI runtime). When the UI runtime is terminated, the orphaned JSI
      // objects would crash the app when their destructors are called, because
      // they call into a memory that's managed by the terminated runtime. We
      // accept the tradeoff of leaking memory here, as it has a limited impact.
      // This scenario can only occur when the React instance is torn down which
      // happens in development mode during app reloads, or in production when
      // the app is being shut down gracefully by the system. An alternative
      // solution would require us to keep track of all JSI values that are in
      // use which would require additional data structure and compute spent on
      // bookkeeping that only for the sake of destroying the values in time
      // before the runtime is terminated. Note that the underlying memory that
      // jsi::Value refers to is managed by the VM and gets freed along with the
      // runtime.
      remoteValue_.release();
    }
  }
  jsi::Value toJSValue(jsi::Runtime &rt) override {
    if (initializer_ != nullptr) {
      auto initObj = initializer_->getJSValue(rt);
      remoteValue_ = std::make_unique<jsi::Value>(
          runtimeHelper_->valueUnpacker->call(rt, initObj));
      initializer_ = nullptr; // we can release ref to initializer as this
                              // method should be called at most once
    }
    return jsi::Value(rt, *remoteValue_);
  }
};

class ShareableSynchronizedDataHolder
    : public Shareable,
      public std::enable_shared_from_this<ShareableSynchronizedDataHolder> {
 private:
  std::shared_ptr<JSRuntimeHelper> runtimeHelper_;
  std::shared_ptr<Shareable> data_;
  std::shared_ptr<jsi::Value> uiValue_;
  std::shared_ptr<jsi::Value> rnValue_;
  std::mutex dataAccessMutex_; // Protects `data_`.

 public:
  ShareableSynchronizedDataHolder(
      std::shared_ptr<JSRuntimeHelper> runtimeHelper,
      jsi::Runtime &rt,
      const jsi::Value &initialValue)
      : Shareable(SynchronizedDataHolder),
        runtimeHelper_(runtimeHelper),
        data_(extractShareableOrThrow(rt, initialValue)) {}

  jsi::Value get(jsi::Runtime &rt) {
    std::unique_lock<std::mutex> read_lock(dataAccessMutex_);
    if (runtimeHelper_->isUIRuntime(rt)) {
      if (uiValue_ == nullptr) {
        auto value = data_->getJSValue(rt);
        uiValue_ = std::make_shared<jsi::Value>(rt, value);
        return value;
      } else {
        return jsi::Value(rt, *uiValue_);
      }
    } else {
      if (rnValue_ == nullptr) {
        auto value = data_->getJSValue(rt);
        rnValue_ = std::make_shared<jsi::Value>(rt, value);
        return value;
      } else {
        return jsi::Value(rt, *rnValue_);
      }
    }
  }

  void set(jsi::Runtime &rt, const jsi::Value &data) {
    std::unique_lock<std::mutex> write_lock(dataAccessMutex_);
    data_ = extractShareableOrThrow(rt, data);
    uiValue_.reset();
    rnValue_.reset();
  }

  jsi::Value toJSValue(jsi::Runtime &rt) override {
    return ShareableJSRef::newHostObject(rt, shared_from_this());
  };
};

class ShareableString : public Shareable {
 public:
  explicit ShareableString(const std::string &string)
      : Shareable(StringType), data_(string) {}
  jsi::Value toJSValue(jsi::Runtime &rt) override {
    return jsi::String::createFromUtf8(rt, data_);
  }

 protected:
  std::string data_;
};

class ShareableScalar : public Shareable {
 public:
  explicit ShareableScalar(double number) : Shareable(NumberType) {
    data_.number = number;
  }
  explicit ShareableScalar(bool boolean) : Shareable(BooleanType) {
    data_.boolean = boolean;
  }
  ShareableScalar() : Shareable(UndefinedType) {}
  explicit ShareableScalar(std::nullptr_t) : Shareable(NullType) {}

  jsi::Value toJSValue(jsi::Runtime &rt) override {
    switch (valueType_) {
      case Shareable::UndefinedType:
        return jsi::Value();
      case Shareable::NullType:
        return jsi::Value(nullptr);
      case Shareable::BooleanType:
        return jsi::Value(data_.boolean);
      case Shareable::NumberType:
        return jsi::Value(data_.number);
      default:
        throw std::runtime_error(
            "attempted to convert object that's not of a scalar type");
    }
  }

 protected:
  union Data {
    bool boolean;
    double number;
  };

 private:
  Data data_;
};

} // namespace reanimated
