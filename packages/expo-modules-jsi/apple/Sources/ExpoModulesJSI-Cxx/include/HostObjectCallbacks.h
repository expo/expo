#pragma once

#ifdef __cplusplus

#include <swift/bridging>
#include <jsi/jsi.h>

#include "RetainedSwiftPointer.h"

namespace expo {

/**
 Holds a pointer to `HostObjectContext` in Swift and host object's callbacks.
 */
class HostObjectCallbacks final {
public:
  using Context = void *_Nonnull;
  using PropNameIds = std::vector<facebook::jsi::PropNameID>;
  using Getter = facebook::jsi::Value(Context, const char *_Nonnull name);
  using Setter = void(Context, const char *_Nonnull name, void *_Nonnull value);
  using PropertyNamesGetter = PropNameIds(Context);
  using Deallocator = void(Context);

  explicit HostObjectCallbacks(Context context, Getter getter, Setter setter, PropertyNamesGetter propertyNamesGetter, Deallocator deallocator)
  : _context(context), _getter(std::move(getter)), _setter(std::move(setter)), _propertyNamesGetter(std::move(propertyNamesGetter)), _deallocator(std::move(deallocator)) {}

  inline facebook::jsi::Value get(const char *_Nonnull name) const {
    return _getter(_context, name);
  }

  inline void set(const char *_Nonnull name, const facebook::jsi::Value &value) const {
    _setter(_context, name, (void *)(&value));
  }

  inline PropNameIds getPropertyNames() const {
    return _propertyNamesGetter(_context);
  }

  inline void dealloc() {
    _deallocator(_context);
  }

private:
  Context _context;
  Getter *_Nonnull _getter;
  Setter *_Nonnull _setter;
  PropertyNamesGetter *_Nonnull _propertyNamesGetter;
  Deallocator *_Nonnull _deallocator;

} SWIFT_NONCOPYABLE; // class HostObjectCallbacks

} // namespace expo

#endif // __cplusplus
