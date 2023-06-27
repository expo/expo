#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include "JsiHostObject.h"
#include "JsiValueWrapper.h"
#include "RNSkPlatformContext.h"
#include "RNSkValue.h"
#include "RNSkView.h"
#include <jsi/jsi.h>

namespace RNSkia {
namespace jsi = facebook::jsi;

using RNSkViewInfo = struct RNSkViewInfo {
  RNSkViewInfo() { view = nullptr; }
  std::shared_ptr<RNSkView> view;
  std::unordered_map<std::string, RNJsi::JsiValueWrapper> props;
};

class RNSkJsiViewApi : public RNJsi::JsiHostObject,
                       public std::enable_shared_from_this<RNSkJsiViewApi> {
public:
  /**
   Sets a custom property on a view given a view id. The property name/value
   will be stored in a map alongside the id of the view and propagated to the
   view when needed.
   */
  JSI_HOST_FUNCTION(setJsiProperty) {
    if (count != 3) {
      _platformContext->raiseError(
          std::string("setJsiProperty: Expected 3 arguments, got " +
                      std::to_string(count) + "."));
      return jsi::Value::undefined();
    }

    if (!arguments[0].isNumber()) {
      _platformContext->raiseError(
          "setJsiProperty: First argument must be a number");
      return jsi::Value::undefined();
    }

    if (!arguments[1].isString()) {
      _platformContext->raiseError("setJsiProperty: Second argument must be "
                                   "the name of the property to set.");

      return jsi::Value::undefined();
    }
    auto nativeId = arguments[0].asNumber();
    auto info = getEnsuredViewInfo(nativeId);

    std::lock_guard<std::mutex> lock(_mutex);
    info->props.insert_or_assign(arguments[1].asString(runtime).utf8(runtime),
                                 RNJsi::JsiValueWrapper(runtime, arguments[2]));

    // Now let's see if we have a view that we can update
    if (info->view != nullptr) {
      // Update view!
      info->view->setNativeId(nativeId);
      info->view->setJsiProperties(info->props);
      info->props.clear();
    }

    return jsi::Value::undefined();
  }

  /**
   Calls a custom command / method on a view by the view id.
   */
  JSI_HOST_FUNCTION(callJsiMethod) {
    if (count < 2) {
      _platformContext->raiseError(
          std::string("callCustomCommand: Expected at least 2 arguments, got " +
                      std::to_string(count) + "."));

      return jsi::Value::undefined();
    }

    if (!arguments[0].isNumber()) {
      _platformContext->raiseError(
          "callCustomCommand: First argument must be a number");

      return jsi::Value::undefined();
    }

    if (!arguments[1].isString()) {
      _platformContext->raiseError("callCustomCommand: Second argument must be "
                                   "the name of the action to call.");

      return jsi::Value::undefined();
    }

    auto nativeId = arguments[0].asNumber();
    auto action = arguments[1].asString(runtime).utf8(runtime);

    auto info = getEnsuredViewInfo(nativeId);

    if (info->view == nullptr) {
      throw jsi::JSError(
          runtime, std::string("callCustomCommand: Could not call action " +
                               action + " on view - view not ready.")
                       .c_str());

      return jsi::Value::undefined();
    }

    // Get arguments
    size_t paramsCount = count - 2;
    const jsi::Value *params = paramsCount > 0 ? &arguments[2] : nullptr;
    return info->view->callJsiMethod(runtime, action, params, paramsCount);
  }

  JSI_HOST_FUNCTION(requestRedraw) {
    if (count != 1) {
      _platformContext->raiseError(
          std::string("requestRedraw: Expected 1 arguments, got " +
                      std::to_string(count) + "."));

      return jsi::Value::undefined();
    }

    if (!arguments[0].isNumber()) {
      _platformContext->raiseError(
          "requestRedraw: First argument must be a number");

      return jsi::Value::undefined();
    }

    // find Skia View
    int nativeId = arguments[0].asNumber();

    auto info = getEnsuredViewInfo(nativeId);
    if (info->view != nullptr) {
      info->view->requestRedraw();
    }
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(makeImageSnapshot) {
    if (count < 1) {
      _platformContext->raiseError(
          std::string("makeImageSnapshot: Expected at least 1 argument, got " +
                      std::to_string(count) + "."));
      return jsi::Value::undefined();
    }

    if (!arguments[0].isNumber()) {
      _platformContext->raiseError(
          "makeImageSnapshot: First argument must be a number");
      return jsi::Value::undefined();
    }

    // find Skia view
    int nativeId = arguments[0].asNumber();
    sk_sp<SkImage> image;
    auto info = getEnsuredViewInfo(nativeId);
    if (info->view != nullptr) {
      if (count > 1 && !arguments[1].isUndefined() && !arguments[1].isNull()) {
        auto rect = JsiSkRect::fromValue(runtime, arguments[1]);
        image = info->view->makeImageSnapshot(rect);
      } else {
        image = info->view->makeImageSnapshot(nullptr);
      }
      if (image == nullptr) {
        throw jsi::JSError(runtime,
                           "Could not create image from current surface.");
        return jsi::Value::undefined();
      }
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkImage>(_platformContext, image));
    }
    throw jsi::JSError(runtime, "No Skia View currently available.");
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(registerValuesInView) {
    // Check params
    if (!arguments[1].isObject() ||
        !arguments[1].asObject(runtime).isArray(runtime)) {
      throw jsi::JSError(runtime,
                         "Expected array of Values as second parameter");
      return jsi::Value::undefined();
    }

    // Get identifier of native SkiaView
    int nativeId = arguments[0].asNumber();

    // Get values that should be added as dependencies
    auto values = arguments[1].asObject(runtime).asArray(runtime);
    std::vector<std::function<void()>> unsubscribers;
    const std::size_t size = values.size(runtime);
    unsubscribers.reserve(size);
    for (size_t i = 0; i < size; ++i) {
      auto value = values.getValueAtIndex(runtime, i)
                       .asObject(runtime)
                       .asHostObject<RNSkReadonlyValue>(runtime);

      if (value != nullptr) {
        // Add change listener
        unsubscribers.push_back(value->addListener(
            [weakSelf = weak_from_this(), nativeId](jsi::Runtime &) {
              auto self = weakSelf.lock();
              if (self) {
                auto info = self->getEnsuredViewInfo(nativeId);
                if (info->view != nullptr) {
                  info->view->requestRedraw();
                }
              }
            }));
      }
    }

    // Return unsubscribe method that unsubscribes to all values
    // that we subscribed to.
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "unsubscribe"), 0,
        JSI_HOST_FUNCTION_LAMBDA {
          // decrease dependency count on the Skia View
          for (auto &unsub : unsubscribers) {
            unsub();
          }
          return jsi::Value::undefined();
        });
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(RNSkJsiViewApi, setJsiProperty),
                       JSI_EXPORT_FUNC(RNSkJsiViewApi, callJsiMethod),
                       JSI_EXPORT_FUNC(RNSkJsiViewApi, registerValuesInView),
                       JSI_EXPORT_FUNC(RNSkJsiViewApi, requestRedraw),
                       JSI_EXPORT_FUNC(RNSkJsiViewApi, makeImageSnapshot))

  /**
   * Constructor
   * @param platformContext Platform context
   */
  explicit RNSkJsiViewApi(std::shared_ptr<RNSkPlatformContext> platformContext)
      : JsiHostObject(), _platformContext(platformContext) {}

  /**
   * Invalidates the Skia View Api object
   */
  void invalidate() { unregisterAll(); }

  /**
   Call to remove all draw view infos
   */
  void unregisterAll() {
    // Unregister all views
    auto tempList = _viewInfos;
    for (const auto &info : tempList) {
      unregisterSkiaView(info.first);
    }
    std::lock_guard<std::mutex> lock(_mutex);
    _viewInfos.clear();
  }

  /**
   * Registers a skia view
   * @param nativeId Id of view to register
   * @param view View to register
   */
  void registerSkiaView(size_t nativeId, std::shared_ptr<RNSkView> view) {
    auto info = getEnsuredViewInfo(nativeId);
    std::lock_guard<std::mutex> lock(_mutex);
    info->view = view;
    info->view->setNativeId(nativeId);
    info->view->setJsiProperties(info->props);
    info->props.clear();
  }

  /**
   * Unregisters a Skia draw view
   * @param nativeId View id
   */
  void unregisterSkiaView(size_t nativeId) {
    if (_viewInfos.count(nativeId) == 0) {
      return;
    }
    auto info = getEnsuredViewInfo(nativeId);

    std::lock_guard<std::mutex> lock(_mutex);
    info->view = nullptr;
    _viewInfos.erase(nativeId);
  }

  /**
   Sets a skia draw view for the given id. This function can be used
   to mark that an underlying SkiaView is not available (it could be
   removed due to ex. a transition). The view can be set to a nullptr
   or a valid view, effectively toggling the view's availability.
   */
  void setSkiaView(size_t nativeId, std::shared_ptr<RNSkView> view) {
    if (_viewInfos.find(nativeId) == _viewInfos.end()) {
      return;
    }
    auto info = getEnsuredViewInfo(nativeId);
    std::lock_guard<std::mutex> lock(_mutex);
    if (view != nullptr) {
      info->view = view;
      info->view->setNativeId(nativeId);
      info->view->setJsiProperties(info->props);
      info->props.clear();
    } else if (view == nullptr) {
      info->view = view;
    }
  }

private:
  /**
   * Creates or returns the callback info object for the given view
   * @param nativeId View id
   * @return The callback info object for the requested view
   */
  RNSkViewInfo *getEnsuredViewInfo(size_t nativeId) {
    if (_viewInfos.count(nativeId) == 0) {
      RNSkViewInfo info;
      std::lock_guard<std::mutex> lock(_mutex);
      _viewInfos.emplace(nativeId, info);
    }
    return &_viewInfos.at(nativeId);
  }

  std::unordered_map<size_t, RNSkViewInfo> _viewInfos;
  std::shared_ptr<RNSkPlatformContext> _platformContext;
  std::mutex _mutex;
};
} // namespace RNSkia
