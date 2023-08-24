#pragma once

#include "DrawingContext.h"
#include "JsiValue.h"
#include "NodeProp.h"

#include <map>
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace RNSkia {

/**
 This class manages marshalling from JS values over JSI to C++ values and is
 typically called when a new node is created or an existing node is updated from
 the reconciler.
 */
class NodePropsContainer {
public:
  /**
   Constructor for the node prop container
   */
  explicit NodePropsContainer(
      PropId componentType,
      const std::function<void(BaseNodeProp *)> &onPropChanged)
      : _onPropChanged(onPropChanged), _type(componentType) {}

  /**
   Returns true if there are any changes in the props container in the current
   being/end visit
   */
  bool isChanged() {
    for (auto &prop : _properties) {
      if (prop->isChanged()) {
        return true;
      }
    }
    return false;
  }

  /**
   Enumerate all mapped properties
   */
  void enumerateMappedProps(
      const std::function<void(const PropId name,
                               const std::vector<NodeProp *>)> &callback) {
    std::lock_guard<std::mutex> lock(_mappedPropsLock);
    for (auto &props : _mappedProperties) {
      callback(props.first, props.second);
    }
  }

  /**
   Enumerates a named property instances from the mapped properties list
   */
  void
  enumerateMappedPropsByName(const std::string &name,
                             const std::function<void(NodeProp *)> &callback) {
    std::lock_guard<std::mutex> lock(_mappedPropsLock);
    auto propMapIt = _mappedProperties.find(JsiPropId::get(name));
    if (propMapIt != _mappedProperties.end()) {
      for (auto &prop : propMapIt->second) {
        callback(prop);
      }
    }
  }

  /**
   Updates any props that has changes waiting, updates props that have derived
   values
   */
  void updatePendingValues() {
    for (auto &prop : _properties) {
      prop->updatePendingChanges();
      if (prop->isRequired() && !prop->isSet()) {
        throw std::runtime_error("Missing one or more required properties " +
                                 std::string(prop->getName()) + " in the " +
                                 _type + " component.");
      }
    }
  }

  /**
   We're done, mark any changes as committed in all props
   */
  void markAsResolved() {
    for (auto &prop : _properties) {
      prop->markAsResolved();
    }
  }

  /**
   Clears all props and data from the container
   */
  void dispose() {
    std::lock_guard<std::mutex> lock(_mappedPropsLock);
    _properties.clear();
    _mappedProperties.clear();
  }

  /**
   Called when the React / JS side sets properties on a node
   */
  void setProps(jsi::Runtime &runtime, const jsi::Value &maybePropsObject) {
    std::lock_guard<std::mutex> lock(_mappedPropsLock);

    // Clear property mapping
    _mappedProperties.clear();

    if (!maybePropsObject.isObject()) {
      throw jsi::JSError(runtime, "Expected property object.");
    }

    auto props = maybePropsObject.asObject(runtime);

    // Use specialized reader function to be able to intercept calls that
    // reads specific named values from the js property object.
    auto read = [&](jsi::Runtime &runtime, PropId name, NodeProp *prop) {
      if (_mappedProperties.count(name) == 0) {
        std::vector<NodeProp *> tmp;
        _mappedProperties[name] = std::move(tmp);
      }
      _mappedProperties.at(name).push_back(prop);
      return props.getProperty(runtime, name);
    };

    for (auto &prop : _properties) {
      prop->readValueFromJs(runtime, read);
    }
  }

  /**
   Defines a property that will be added to the container
   */
  template <class _Tp, class... _Args,
            class = std::enable_if_t<!std::is_array<_Tp>::value>>
  _Tp *defineProperty(_Args &&...__args) {
    // Create property and set onChange callback
    auto prop =
        std::make_shared<_Tp>(std::forward<_Args>(__args)..., _onPropChanged);

    // Add to props list
    _properties.push_back(prop);

    return prop.get();
  }

private:
  std::function<void(BaseNodeProp *)> _onPropChanged;
  std::vector<std::shared_ptr<BaseNodeProp>> _properties;
  std::map<PropId, std::vector<NodeProp *>> _mappedProperties;
  PropId _type;
  std::mutex _mappedPropsLock;
};

} // namespace RNSkia
