#pragma once

#ifdef __cplusplus

#include <unordered_map>
#include <list>
#include <jsi/jsi.h>

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
  void add(jsi::Runtime &runtime, std::string eventName, const jsi::Function &listener) noexcept;

  /**
   Removes the listener for the given event name.
   */
  void remove(jsi::Runtime &runtime, std::string eventName, const jsi::Function &listener) noexcept;

  /**
   Removes all listeners for the given event name.
   */
  void removeAll(std::string eventName) noexcept;

  /**
   Clears the entire map of events and listeners.
   */
  void clear() noexcept;

  /**
   Returns a number of listeners added for the given event name.
   */
  size_t listenersCount(std::string eventName) noexcept;

  /**
   Calls listeners for the given event name, with the given `this` object and payload arguments.
   */
  void call(jsi::Runtime &runtime, std::string eventName, const jsi::Object &thisObject, const jsi::Value *args, size_t count) noexcept;
};

/**
 Class representing a native state of objects that emit events.
 */
class JSI_EXPORT NativeState : public jsi::NativeState {
public:
  using Shared = std::shared_ptr<NativeState>;

  NativeState();
  virtual ~NativeState();

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
void emitEvent(jsi::Runtime &runtime, jsi::Object &emitter, const std::string &eventName, const std::vector<jsi::Value> &arguments);

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
