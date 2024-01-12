#pragma once

#include <memory>
#include <utility>

#include "JsiHostObject.h"
#include "RNSkPlatformContext.h"

namespace RNSkia {

namespace jsi = facebook::jsi;

/**
 * Base class for jsi host objects - these are all implemented as JsiHostObjects
 * and has a pointer to the platform context.
 */
class JsiSkHostObject : public RNJsi::JsiHostObject {
public:
  /**
   * Default constructor
   * @param context Platform context
   */
  explicit JsiSkHostObject(std::shared_ptr<RNSkPlatformContext> context)
      : _context(context) {}

protected:
  /**
   * @return A pointer to the platform context
   */
  std::shared_ptr<RNSkPlatformContext> getContext() { return _context; }

private:
  std::shared_ptr<RNSkPlatformContext> _context;
};

#define JSI_API_TYPENAME(A)                                                    \
  JSI_PROPERTY_GET(__typename__) {                                             \
    return jsi::String::createFromUtf8(runtime, #A);                           \
  }

#define EXPORT_JSI_API_TYPENAME(CLASS, TYPENAME)                               \
  JSI_API_TYPENAME(TYPENAME)                                                   \
  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(CLASS, __typename__))

template <typename T> class JsiSkWrappingHostObject : public JsiSkHostObject {
public:
  /**
   * Default constructor
   * @param context Platform context
   */
  JsiSkWrappingHostObject(std::shared_ptr<RNSkPlatformContext> context,
                          T object)
      : JsiSkHostObject(std::move(context)), _object(std::move(object)) {}

  /**
   * Returns the underlying object exposed by this host object. This object
   * should be wrapped in a shared pointer of some kind
   * @return Underlying object
   */
  T getObject() { return _object; }
  const T getObject() const { return _object; }

  /**
   Updates the inner object with a new version of the object.
   */
  void setObject(T object) { _object = object; }

  /**
   Dispose function that can be exposed to JS by using the JSI_API_TYPENAME
   macro
   */
  JSI_HOST_FUNCTION(dispose) {
    safeDispose();
    return jsi::Value::undefined();
  }

protected:
  /**
   Override to implement disposale of allocated resources like smart pointers
   etc. This method will only be called once for each instance of this class.
   */
  virtual void releaseResources() = 0;

private:
  void safeDispose() {
    if (!_isDisposed) {
      _isDisposed = true;
      releaseResources();
    }
  }

  /**
   * Wrapped object
   */
  T _object;

  /**
   Resource disposed flag
   */
  std::atomic<bool> _isDisposed = {false};
};

template <typename T>
class JsiSkWrappingSharedPtrHostObject
    : public JsiSkWrappingHostObject<std::shared_ptr<T>> {
public:
  JsiSkWrappingSharedPtrHostObject(std::shared_ptr<RNSkPlatformContext> context,
                                   std::shared_ptr<T> object)
      : JsiSkWrappingHostObject<std::shared_ptr<T>>(std::move(context),
                                                    std::move(object)) {}

  /**
    Returns the underlying object from a host object of this type
   */
  static std::shared_ptr<T> fromValue(jsi::Runtime &runtime,
                                      const jsi::Value &obj) {
    return std::static_pointer_cast<JsiSkWrappingSharedPtrHostObject>(
               obj.asObject(runtime).asHostObject(runtime))
        ->getObject();
  }

protected:
  void releaseResources() override {
    // Clear internally allocated objects
    this->setObject(nullptr);
  }
};

template <typename T>
class JsiSkWrappingSkPtrHostObject : public JsiSkWrappingHostObject<sk_sp<T>> {
public:
  JsiSkWrappingSkPtrHostObject(std::shared_ptr<RNSkPlatformContext> context,
                               sk_sp<T> object)
      : JsiSkWrappingHostObject<sk_sp<T>>(std::move(context),
                                          std::move(object)) {}

  /**
    Returns the underlying object from a host object of this type
   */
  static sk_sp<T> fromValue(jsi::Runtime &runtime, const jsi::Value &obj) {
    return std::static_pointer_cast<JsiSkWrappingSkPtrHostObject>(
               obj.asObject(runtime).asHostObject(runtime))
        ->getObject();
  }

protected:
  void releaseResources() override {
    // Clear internally allocated objects
    this->setObject(nullptr);
  }
};

} // namespace RNSkia
