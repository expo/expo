#pragma once

#ifdef __cplusplus

#include <unordered_map>
#include <list>
#include <jsi/jsi.h>

// Apple ships ExpoModulesJSI; non-Apple platforms (Android) don't, so the
// EventEmitter native state falls back to inheriting from `jsi::NativeState`
// directly when this header isn't available.
#if __has_include(<ExpoModulesJSI/NativeState.h>)
#include <ExpoModulesJSI/NativeState.h>
#endif

namespace jsi = facebook::jsi;

namespace expo::EventEmitter {

/**
 Class containing and managing listeners of the event emitter.
 */
class Listeners {
private:
  friend class NativeState;
  friend void addListener(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName, const jsi::Function &listener);
  friend void removeListener(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName, const jsi::Function &listener);
  friend void removeAllListeners(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName);
  friend void emitEvent(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName, const jsi::Value *args, size_t count);
  friend size_t getListenerCount(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName);

  /**
   Type of the list containing listeners for the specific event name.
   */
  using ListenersList = std::list<jsi::Value>;

  /**
   Type of the map where the keys are event names and the values are lists of listeners.
   */
  using ListenersMap = std::unordered_map<std::string, ListenersList>;

  /**
   Map with the events and listeners.
   */
  ListenersMap listenersMap;

  /**
   Adds a listener for the given event name.
   */
  void add(jsi::Runtime &runtime, const std::string& eventName, const jsi::Function &listener) noexcept;

  /**
   Removes the listener for the given event name.
   */
  void remove(jsi::Runtime &runtime, const std::string& eventName, const jsi::Function &listener) noexcept;

  /**
   Removes all listeners for the given event name.
   */
  void removeAll(const std::string& eventName) noexcept;

  /**
   Clears the entire map of events and listeners.
   */
  void clear() noexcept;

  /**
   Returns a number of listeners added for the given event name.
   */
  size_t listenersCount(const std::string& eventName) noexcept;

  /**
   Calls listeners for the given event name, with the given `this` object and payload arguments.
   */
  void call(jsi::Runtime &runtime, const std::string& eventName, const jsi::Object &thisObject, const jsi::Value *args, size_t count) noexcept;
};

// Apple platforms ship `expo::NativeState`, which carries an opaque context pointer
// (used to round-trip through Swift's `JavaScriptNativeState`). On other platforms
// the native state inherits directly from `jsi::NativeState`; the context args
// passed to the constructor are ignored there.
#if __has_include(<ExpoModulesJSI/NativeState.h>)
using NativeStateBase = expo::NativeState;
#else
using NativeStateBase = facebook::jsi::NativeState;
#endif

/**
 Class representing a native state of objects that emit events.
 */
class JSI_EXPORT NativeState : public NativeStateBase {
public:
  using Shared = std::shared_ptr<NativeState>;

  /**
   The `context` and `contextDeallocator` are forwarded to `expo::NativeState`
   on Apple platforms so the JS-side `getNativeState` can round-trip back to a
   Swift wrapper. They are ignored on platforms without ExpoModulesJSI.
   */
  explicit NativeState(void *context = nullptr, void (*contextDeallocator)(void *) = nullptr);
  ~NativeState() override;

  /**
   A structure containing event listeners.
   */
  Listeners listeners;

  /**
   Gets event emitter's native state from the given object.
   If `createIfMissing` is set to `true`, the state will be automatically created.
   */
  static Shared get(jsi::Runtime &runtime, const jsi::Object &object, bool createIfMissing = false);
};

/**
 Emits an event with the given name and arguments to the emitter object.
 Does nothing if the given object is not an instance of the EventEmitter class.
 */
void emitEvent(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName, const std::vector<jsi::Value> &arguments);

/**
 Same as above but takes a raw `jsi::Value` pointer and count.
 */
void emitEvent(jsi::Runtime &runtime, const jsi::Object &emitter, const std::string &eventName, const jsi::Value *args, size_t count);

/**
 Gets `expo.EventEmitter` class from the given runtime.
 */
jsi::Function getClass(jsi::Runtime &runtime);

/**
 Installs `expo.EventEmitter` class in the given runtime.
 */
void installClass(jsi::Runtime &runtime);

} // namespace expo::EventEmitter

#endif // __cplusplus
