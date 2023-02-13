#pragma once

#include "BaseNodeProp.h"
#include "JsiValue.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace ABI48_0_0RNSkia {

/**
 Class for composing multiple properties into a derived property value
 */
class BaseDerivedProp : public BaseNodeProp {
public:
  BaseDerivedProp() : BaseNodeProp() {}

  /**
   Starts the process of updating and reading props
   */
  void updatePendingChanges() override {
    auto changed = false;
    for (auto &prop : _properties) {
      prop->updatePendingChanges();
      if (prop->isChanged()) {
        changed = true;
      }
    }

    // We only need to update the derived value when any of the derived
    // properties have changed.
    if (changed) {
      updateDerivedValue();
    }
  }

  /*
   Marks properties as no longer changed
   */
  void markAsResolved() override {
    for (auto &prop : _properties) {
      prop->markAsResolved();
    }

    _isChanged = false;
  }

  /**
   Returns the changed state of the prop
   */
  bool isChanged() override { return _isChanged; }

  /**
   Delegate read value to child nodes
   */
  void readValueFromJs(jsi::Runtime &runtime,
                       const ReadPropFunc &read) override {
    for (auto &prop : _properties) {
      prop->readValueFromJs(runtime, read);
    }
  }

  /**
   Override to calculate the derived value from child properties
   */
  virtual void updateDerivedValue() = 0;

  /**
   Adds a property to the derived property child props.
   */
  template <typename P = BaseNodeProp> P *addProperty(std::shared_ptr<P> prop) {
    _properties.push_back(prop);
    return prop.get();
  }

  /*
   Return name of properties in derived prop as a comma separated list
   */
  std::string getName() override {
    std::string v = "";
    for (size_t i = 0; i < _properties.size(); ++i) {
      v += _properties[i]->getName() + (i < _properties.size() - 1 ? ", " : "");
    }
    return v;
  }

  /**
   Returns true if one or more of the child props has values
   */
  bool isSet() override {
    for (auto &prop : _properties) {
      if (prop->isSet()) {
        return true;
      }
    }
    return false;
  }

protected:
  void setIsChanged(bool isChanged) { _isChanged = isChanged; }

private:
  std::vector<std::shared_ptr<BaseNodeProp>> _properties;
  std::atomic<bool> _isChanged = {false};
};

/**
 Class for composing multiple properties into a derived property value
 */
template <typename T> class DerivedProp : public BaseDerivedProp {
public:
  DerivedProp() : BaseDerivedProp() {}

  /**
  Returns the derived value
   */
  std::shared_ptr<const T> getDerivedValue() { return _derivedValue; }

  /**
   Returns true if is optional and one of the child props has a value, or all
   props if optional is false.
   */
  bool isSet() override { return _derivedValue != nullptr; };

protected:
  /**
   Set derived value from sub classes
   */
  void setDerivedValue(std::shared_ptr<const T> value) {
    setIsChanged(_derivedValue != value);
    _derivedValue = value;
  }

  /**
   Set derived value from sub classes
   */
  void setDerivedValue(const T &&value) {
    setIsChanged(true);
    _derivedValue = std::make_shared<const T>(std::move(value));
  }

private:
  std::shared_ptr<const T> _derivedValue;
};

/**
 Class for composing multiple properties into a derived property value
 */
template <typename T> class DerivedSkProp : public BaseDerivedProp {
public:
  DerivedSkProp() : BaseDerivedProp() {}

  /**
  Returns the derived value
   */
  sk_sp<T> getDerivedValue() { return _derivedValue; }

  /**
   Returns true if is optional and one of the child props has a value, or all
   props if optional is false.
   */
  bool isSet() override { return _derivedValue != nullptr; };

protected:
  /**
   Set derived value from sub classes
   */
  void setDerivedValue(sk_sp<T> value) {
    setIsChanged(_derivedValue != value);
    _derivedValue = value;
  }

  /**
   Set derived value from sub classes
   */
  void setDerivedValue(const T &&value) {
    setIsChanged(true);
    _derivedValue = sk_make_sp<T>(std::move(value));
  }

private:
  sk_sp<T> _derivedValue;
};

} // namespace ABI48_0_0RNSkia
