#pragma once

#include "BaseNodeProp.h"
#include "JsiValue.h"

#include <chrono>
#include <memory>
#include <mutex>
#include <string>

namespace RNSkia {

/**
 Simple class for reading a property by name from the Dom Node properties
 object.
 */
class NodeProp : public BaseNodeProp,
                 public std::enable_shared_from_this<NodeProp> {
public:
  /**
   Constructs a new optional dom node properrty
   */
  explicit NodeProp(const std::string &name,
                    const std::function<void(BaseNodeProp *)> &onChange)
      : _name(JsiPropId::get(name)), _onChange(onChange), BaseNodeProp() {}

  /**
   Reads JS value and swaps out with a new value
   */
  void readValueFromJs(jsi::Runtime &runtime,
                       const ReadPropFunc &read) override {
    // If the value is a nullptr this is the first call to the
    // readValueFromJS Function (which comes from the reconciler
    // setting a new property value on the property
    if (_value == nullptr) {
      _value = std::make_unique<JsiValue>(runtime, read(runtime, _name, this));
      _isChanged = true;
      _hasNewValue = false;
    } else {
      // Otherwise we'll just update the buffer and commit it later.
      std::lock_guard<std::mutex> lock(_swapMutex);
      if (_buffer == nullptr) {
        _buffer =
            std::make_unique<JsiValue>(runtime, read(runtime, _name, this));
      } else {
        _buffer->setCurrent(runtime, read(runtime, _name, this));
      }
      _hasNewValue = *_buffer.get() != *_value.get();
      if (_hasNewValue && _onChange != nullptr) {
        _onChange(this);
      }
    }
  }

  /**
   Property value has changed - let's save this as a change to be commited later
   */
  void updateValue(jsi::Runtime &runtime, const jsi::Value &value) {
    // Always use the next field since this method is called on the JS thread
    // and we don't want to rip out the underlying value object.
    std::lock_guard<std::mutex> lock(_swapMutex);
    if (_buffer == nullptr) {
      _buffer = std::make_unique<JsiValue>(runtime, value);
    } else {
      _buffer->setCurrent(runtime, value);
    }
    // This is almost always a change - meaning a swap is
    // cheaper than comparing for equality.
    _hasNewValue = true;
    if (_onChange != nullptr) {
      _onChange(this);
    }
  }

  /**
   Returns true if the property is set and is not undefined or null
   */
  bool isSet() override {
    return _value != nullptr && !_value->isUndefinedOrNull();
  }

  /**
   True if the property has changed since we last visited it
   */
  bool isChanged() override { return _isChanged; }

  /**
   Starts the process of updating and reading props
   */
  void updatePendingChanges() override {
    // If the value has changed we should swap the
    // buffers
    if (_hasNewValue && _buffer != nullptr) {
      {
        // Swap buffers
        std::lock_guard<std::mutex> lock(_swapMutex);
        _value.swap(_buffer);

        // turn off pending changes flag
        _hasNewValue = false;
      }

      // Mark as changed.
      _isChanged = true;
    }
  }

  /*
   Ends the visit cycle
   */
  void markAsResolved() override { _isChanged = false; }

  /**
   Returns pointer to the value contained by the property if the property is
   set.
   */
  const JsiValue &value() {
    assert(isSet());
    return *_value;
  }

  /**
   Returns the name of the property
   */
  std::string getName() override { return std::string(_name); }

private:
  PropId _name;

  std::function<void(BaseNodeProp *)> _onChange;

  std::unique_ptr<JsiValue> _value;
  std::unique_ptr<JsiValue> _buffer;
  std::atomic<bool> _isChanged = {false};
  std::atomic<bool> _hasNewValue = {false};
  std::mutex _swapMutex;
};

} // namespace RNSkia
