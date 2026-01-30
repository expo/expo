#pragma once

#ifdef __cplusplus

#include <swift/bridging>
#include <jsi/jsi.h>

#include "RetainedSwiftPointer.h"

namespace expo {

class HostObjectCallbacks final : public RetainedSwiftPointer {
public:
  using PropNameIds = std::vector<facebook::jsi::PropNameID>;
  using Getter = facebook::jsi::Value(Context, const char *_Nonnull name);
  using Setter = void(Context, const char *_Nonnull name, void *_Nonnull value);
  using PropertyNamesGetter = PropNameIds(Context);

  explicit HostObjectCallbacks(Context context, Getter getter, Setter setter, PropertyNamesGetter propertyNamesGetter, Deallocator deallocator)
  : RetainedSwiftPointer(context, deallocator), _getter(std::move(getter)), _setter(std::move(setter)), _propertyNamesGetter(std::move(propertyNamesGetter)) {}

  inline facebook::jsi::Value get(const char *_Nonnull name) {
    return _getter(_context, name);
  }

  inline void set(const char *_Nonnull name, const facebook::jsi::Value &value) {
    _setter(_context, name, (void *)(&value));
  }

  inline PropNameIds getPropertyNames() {
    return _propertyNamesGetter(_context);
  }

  inline void dealloc() {
    _deallocator(_context);
  }

  Getter *_Nonnull _getter;
  Setter *_Nonnull _setter;
  PropertyNamesGetter *_Nonnull _propertyNamesGetter;
} SWIFT_IMMORTAL_REFERENCE; // class HostObjectCallbacks

} // namespace expo

#endif // __cplusplus
