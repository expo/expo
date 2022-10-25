#pragma once

#include <memory>
#include <utility>

#include "ABI47_0_0RNSkPlatformContext.h"
#include <JsiHostObject.h>

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;
using namespace ABI47_0_0RNJsi;

/**
 * Base class for jsi host objects
 */
class JsiSkHostObject : public JsiHostObject {
public:
  /**
   * Default constructor
   * @param context Platform context
   */
  JsiSkHostObject(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context)
      : _context(context){};

protected:

  /**
   * @return A pointer to the platform context
   */
  std::shared_ptr<ABI47_0_0RNSkPlatformContext> getContext() { return _context; }

private:
  std::shared_ptr<ABI47_0_0RNSkPlatformContext> _context;
};

template <typename T> class JsiSkWrappingHostObject : public JsiSkHostObject {
public:
  /**
   * Default constructor
   * @param context Platform context
   */
  JsiSkWrappingHostObject(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                          T&& object)
      : JsiSkHostObject(std::move(context)), _object(std::move(object)){}
  
  JsiSkWrappingHostObject(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                          const T& object)
      : JsiSkHostObject(std::move(context)), _object(object){}

  /**
   * Returns the underlying object exposed by this host object. This object
   * should be wrapped in a shared pointer of some kind
   * @return Underlying object
   */
  T& getObject() { return _object; }
  const T& getObject() const { return _object; }


private:
  /**
   * Wrapped object
   */
  T _object;
};

template <typename T>
class JsiSkWrappingSharedPtrHostObject
    : public JsiSkWrappingHostObject<std::shared_ptr<T>> {
public:
  JsiSkWrappingSharedPtrHostObject(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                                   std::shared_ptr<T> object)
      : JsiSkWrappingHostObject<std::shared_ptr<T>>(std::move(context), std::move(object)) {}
};

template <typename T>
class JsiSkWrappingSkPtrHostObject : public JsiSkWrappingHostObject<sk_sp<T>> {
public:
  JsiSkWrappingSkPtrHostObject(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                               sk_sp<T> object)
      : JsiSkWrappingHostObject<sk_sp<T>>(std::move(context), std::move(object)) {}
};
} // namespace ABI47_0_0RNSkia
