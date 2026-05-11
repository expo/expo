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

  explicit HostObjectCallbacks(Context context, Getter getter, Setter *_Nullable setter, PropertyNamesGetter propertyNamesGetter, Deallocator deallocator)
  : _context(context), _getter(getter), _setter(setter), _propertyNamesGetter(propertyNamesGetter), _deallocator(deallocator) {}

  inline facebook::jsi::Value get(const char *_Nonnull name) const {
    return _getter(_context, name);
  }

  /**
   Dispatches to the Swift setter. Throws a `jsi::JSError` if no setter was provided,
   matching the JS engine's behavior for assignment to a property with no setter.

   Only call from inside a JSI host-object trampoline (e.g. `HostObject::set`). The
   thrown `jsi::JSError` is only converted into a JS exception if there is an active
   JSI call frame above this on the stack; calling outside that context will surface
   the throw as an unhandled C++ exception.
   */
  inline void set(facebook::jsi::Runtime &runtime, const char *_Nonnull name, const facebook::jsi::Value &value) const {
    if (_setter == nullptr) {
      throw facebook::jsi::JSError(
        runtime,
        std::string("Cannot set property '") + name + "' on a read-only host object: "
          "no setter was provided when the host object was created. "
          "Pass a `set` closure to `createHostObject` to make this property writable."
      );
    }
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
  Setter *_Nullable _setter;
  PropertyNamesGetter *_Nonnull _propertyNamesGetter;
  Deallocator *_Nonnull _deallocator;

} SWIFT_NONCOPYABLE; // class HostObjectCallbacks

} // namespace expo

#endif // __cplusplus
