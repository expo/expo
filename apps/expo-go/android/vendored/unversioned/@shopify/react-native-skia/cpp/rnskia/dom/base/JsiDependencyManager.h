#pragma once

#include "JsiHostObject.h"

#include "RNSkPlatformContext.h"

#include "JsiDomNode.h"

#include <map>
#include <memory>
#include <set>
#include <string>
#include <utility>
#include <vector>

namespace RNSkia {

static PropId PropNameSelector = JsiPropId::get("selector");
static PropId PropNameValue = JsiPropId::get("value");

class JsiDependencyManager
    : public JsiHostObject,
      public std::enable_shared_from_this<JsiDependencyManager> {
public:
  JsiDependencyManager(std::shared_ptr<RNSkPlatformContext> context,
                       jsi::Runtime &runtime,
                       const jsi::Value &registerValuesCallback)
      : _registerValuesCallback(std::make_shared<jsi::Object>(
            registerValuesCallback.asObject(runtime))),
        JsiHostObject() {}

  ~JsiDependencyManager() { unsubscribeAll(); }

  /**
   Call to unsubscribe all value listeners from the given node based on the
   current list of subscriptions for the node. This function is typically called
   when the node is unmounted or when one or more properties have changed. NOTE:
   In this implementation we call unsubscribe directly without going through the
   JSI method - but the method is kept for compatibility with the JS
   implementation
   */
  JSI_HOST_FUNCTION(unsubscribeNode) {
    // (node: Node<unknown>)
    auto node =
        getArgumentAsHostObject<JsiDomNode>(runtime, arguments, count, 0);
    unsubscribeNode(node.get());
    return jsi::Value::undefined();
  }

  /**
   Adds listeners to the provided values so that the node is notified when a
   value changes.
   */
  JSI_HOST_FUNCTION(subscribeNode) {
    // subscribeNode<P>(node: Node<unknown>, props: AnimatedProps<P>)
    auto node =
        getArgumentAsHostObject<JsiDomNode>(runtime, arguments, count, 0);
    auto nextProps = getArgumentAsObject(runtime, arguments, count, 1);

    // Save unsubscribe callbacks
    std::vector<
        std::pair<std::shared_ptr<RNSkReadonlyValue>, std::function<void()>>>
        unsubscribers;

    // Enumerate registered keys for the given node to only handle known
    // properties
    node->getPropsContainer()->enumerateMappedProps(
        [&](const PropId key, const std::vector<NodeProp *> &propMapping) {
          auto jsValue = nextProps.getProperty(runtime, key);
          JsiValue nativeValue(runtime, jsValue);

          if (isAnimatedValue(nativeValue)) {
            // Handle Skia Animation Values
            auto animatedValue = getAnimatedValue(nativeValue);
            auto unsubscribe = animatedValue->addListener(
                [animatedValue, propMapping](jsi::Runtime &runtime) {
                  // Get value from animation value
                  auto nextJsValue = animatedValue->getCurrent(runtime);
                  // Update all props that listens to this animation value
                  for (auto &prop : propMapping) {
                    prop->updateValue(runtime, nextJsValue);
                  }
                });

            // Save unsubscribe methods
            unsubscribers.push_back(std::make_pair(animatedValue, unsubscribe));

          } else if (isSelector(nativeValue)) {
            // Handle Skia Animation Value Selectors
            auto animatedValue = std::dynamic_pointer_cast<RNSkReadonlyValue>(
                nativeValue.getValue(PropNameValue).getAsHostObject());

            auto selector =
                nativeValue.getValue(PropNameSelector).getAsFunction();
            // Add subscription to animated value in selector
            auto unsubscribe = animatedValue->addListener(
                [nativeValue, propMapping, selector = std::move(selector),
                 animatedValue](jsi::Runtime &runtime) {
                  // Get value from animation value
                  jsi::Value jsValue = animatedValue->getCurrent(runtime);
                  // Call selector to transform new value
                  auto selectedJsValue =
                      selector(runtime, jsi::Value::null(), &jsValue, 1);
                  // Update all props that listens to this animation value
                  for (auto &prop : propMapping) {
                    prop->updateValue(runtime, selectedJsValue);
                  }
                });

            // Save unsubscribe methods
            unsubscribers.push_back(std::make_pair(animatedValue, unsubscribe));
          }
        });

    // Now let's store the subscription info
    _subscriptions.emplace(node.get(), unsubscribers);

    // Set callback for unsubscribing
    node->setDisposeCallback([node, weakSelf = weak_from_this()]() {
      auto self = weakSelf.lock();
      if (self) {
        self->unsubscribeNode(node.get());
      }
    });

    return jsi::Value::undefined();
  }

  /**
   Called when the hosting container is mounted or updated. This ensures that we
   have a ref to the underlying SkiaView so that we can registers redraw
   listeners on values used in the current View automatically.
   */
  JSI_HOST_FUNCTION(update) {
    if (_unregisterValues != nullptr) {
      // unregisterValues is a pointer to unsubscribing to the automatic
      // re-render when a value change
      _unregisterValues->asFunction(runtime).call(runtime,
                                                  jsi::Value::undefined(), 0);
      _unregisterValues = nullptr;
    }

    // Now let's create connection between view and unique values
    std::set<std::shared_ptr<RNSkReadonlyValue>> uniqueValues;

    for (auto &nodeSub : _subscriptions) {
      for (auto &sub : nodeSub.second) {
        if (uniqueValues.count(sub.first) == 0) {
          uniqueValues.emplace(sub.first);
        }
      }
    }

    // Copy to args
    auto array = jsi::Array(runtime, uniqueValues.size());
    size_t i = 0;
    for (auto &el : uniqueValues) {
      array.setValueAtIndex(runtime, i++,
                            jsi::Object::createFromHostObject(runtime, el));
    }

    // Call JS registerValues callback
    auto func = _registerValuesCallback->asFunction(runtime);
    _unregisterValues = std::make_shared<jsi::Object>(
        func.call(runtime, array, 1).asObject(runtime));

    return jsi::Value::undefined();
  }

  /**
   Called when the hosting container is unmounted or recreated. This ensures
   that we remove all subscriptions to Skia values so that we don't have any
   listeners left after the component is removed.

    * Called when the hosting container is unmounted or recreated. This ensures
   that we remove
    * all subscriptions to Skia values so that we don't have any listeners left
   after
    * the component is removed.
  */
  JSI_HOST_FUNCTION(remove) {
    if (_unregisterValues != nullptr) {
      // unregisterValues is a pointer to unsubscribing to the automatic
      // re-render when a value change
      _unregisterValues->asFunction(runtime).call(runtime,
                                                  jsi::Value::undefined(), 0);
      _unregisterValues = nullptr;
    }

    unsubscribeAll();

    _registerValuesCallback = nullptr;

    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiDependencyManager, unsubscribeNode),
                       JSI_EXPORT_FUNC(JsiDependencyManager, subscribeNode),
                       JSI_EXPORT_FUNC(JsiDependencyManager, update),
                       JSI_EXPORT_FUNC(JsiDependencyManager, remove))

  /**
   Constructor to add to the Api object
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      // Params: registerValues: (values: Array<SkiaValue<unknown>>) => () =>
      // void
      auto obj = std::make_shared<JsiDependencyManager>(context, runtime,
                                                        arguments[0]);

      return jsi::Object::createFromHostObject(runtime, std::move(obj));
    };
  }

private:
  /**
   Removes all subscriptions
   */
  void unsubscribeAll() {
    // Unregister all nodes
    std::vector<JsiDomNode *> tmp;
    tmp.reserve(_subscriptions.size());
    for (auto &subInfo : _subscriptions) {
      tmp.push_back(subInfo.first);
    }
    for (auto &node : tmp) {
      unsubscribeNode(node);
    }

    // Clear all subscriptions
    _subscriptions.clear();
  }

  /**
   Unsubscribes from a given node
   */
  void unsubscribeNode(JsiDomNode *node) {
    if (_subscriptions.count(node) > 0) {
      auto subscriptions = _subscriptions.at(node);
      for (auto &p : subscriptions) {
        p.second();
      }

      // Remove node's subscriptions
      _subscriptions.erase(node);

      // Remove node's callback to avoid keeping
      // cyclic dependencies between dep manager and the node
      node->setDisposeCallback(nullptr);
    }
  }
  /**
   Returns true if the given value is a HostObject and it inherits from
   RNSkReadonlyValue.
   */
  bool isAnimatedValue(JsiValue &value) {
    return value.getType() == PropType::HostObject &&
           std::dynamic_pointer_cast<RNSkReadonlyValue>(
               value.getAsHostObject()) != nullptr;
  }

  /**
   Returns the RNSkReadonlyValue pointer for a value that is an Animated value
   */
  std::shared_ptr<RNSkReadonlyValue> getAnimatedValue(JsiValue &value) {
    return std::dynamic_pointer_cast<RNSkReadonlyValue>(
        value.getAsHostObject());
  }

  /**
   Returns true if the value is a selector. A Selector is a JS object that has
   two properties, the selector and the the value. The selector is a function
   that is used to transform the value - which is an animated skia value.
   */
  bool isSelector(JsiValue &value) {
    // Handling selectors is rather easy, we just add
    // a listener on the selector's callback and then we'll do the javascript
    // resolving in the callback (which will always be on the Javascript
    // thread)!
    if (value.getType() == PropType::Object) {
      if (value.hasValue(PropNameSelector) && value.hasValue(PropNameValue)) {
        return true;
      }
    }
    return false;
  }

  std::shared_ptr<jsi::Object> _registerValuesCallback;
  std::shared_ptr<jsi::Object> _unregisterValues;
  std::map<JsiDomNode *,
           std::vector<std::pair<std::shared_ptr<RNSkReadonlyValue>,
                                 std::function<void()>>>>
      _subscriptions;
};
} // namespace RNSkia
