// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI33_0_0UIManagerBinding.h"

#include <ReactABI33_0_0/debug/SystraceSection.h>

#include <ABI33_0_0jsi/ABI33_0_0JSIDynamic.h>

namespace facebook {
namespace ReactABI33_0_0 {

static ABI33_0_0jsi::Object getModule(
    ABI33_0_0jsi::Runtime &runtime,
    const std::string &moduleName) {
  auto batchedBridge =
      runtime.global().getPropertyAsObject(runtime, "__fbBatchedBridge");
  auto getCallableModule =
      batchedBridge.getPropertyAsFunction(runtime, "getCallableModule");
  auto module = getCallableModule
                    .callWithThis(
                        runtime,
                        batchedBridge,
                        {ABI33_0_0jsi::String::createFromUtf8(runtime, moduleName)})
                    .asObject(runtime);
  return module;
}

void UIManagerBinding::install(
    ABI33_0_0jsi::Runtime &runtime,
    std::shared_ptr<UIManagerBinding> uiManagerBinding) {
  auto uiManagerModuleName = "nativeFabricUIManager";
  auto object = ABI33_0_0jsi::Object::createFromHostObject(runtime, uiManagerBinding);
  runtime.global().setProperty(runtime, uiManagerModuleName, std::move(object));
}

UIManagerBinding::UIManagerBinding(std::unique_ptr<UIManager> uiManager)
    : uiManager_(std::move(uiManager)) {}

void UIManagerBinding::startSurface(
    ABI33_0_0jsi::Runtime &runtime,
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initalProps) const {
  folly::dynamic parameters = folly::dynamic::object();
  parameters["rootTag"] = surfaceId;
  parameters["initialProps"] = initalProps;

  auto module = getModule(runtime, "AppRegistry");
  auto method = module.getPropertyAsFunction(runtime, "runApplication");

  method.callWithThis(
      runtime,
      module,
      {ABI33_0_0jsi::String::createFromUtf8(runtime, moduleName),
       ABI33_0_0jsi::valueFromDynamic(runtime, parameters)});
}

void UIManagerBinding::stopSurface(ABI33_0_0jsi::Runtime &runtime, SurfaceId surfaceId)
    const {
  auto module = getModule(runtime, "ReactABI33_0_0Fabric");
  auto method = module.getPropertyAsFunction(runtime, "unmountComponentAtNode");

  method.callWithThis(runtime, module, {ABI33_0_0jsi::Value{surfaceId}});
}

void UIManagerBinding::dispatchEvent(
    ABI33_0_0jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const ValueFactory &payloadFactory) const {
  SystraceSection s("UIManagerBinding::dispatchEvent");

  auto payload = payloadFactory(runtime);

  auto instanceHandle = eventTarget
    ? [&]() {
      auto instanceHandle = eventTarget->getInstanceHandle(runtime);
      if (instanceHandle.isUndefined()) {
        return ABI33_0_0jsi::Value::null();
      }

      // Mixing `target` into `payload`.
      assert(payload.isObject());
      payload.asObject(runtime).setProperty(runtime, "target", eventTarget->getTag());
      return instanceHandle;
    }()
    : ABI33_0_0jsi::Value::null();

  auto &eventHandlerWrapper =
      static_cast<const EventHandlerWrapper &>(*eventHandler_);

  eventHandlerWrapper.callback.call(
      runtime,
      {std::move(instanceHandle),
       ABI33_0_0jsi::String::createFromUtf8(runtime, type),
       std::move(payload)});
}

void UIManagerBinding::invalidate() const {
  uiManager_->setShadowTreeRegistry(nullptr);
  uiManager_->setDelegate(nullptr);
}

ABI33_0_0jsi::Value UIManagerBinding::get(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::PropNameID &name) {
  auto methodName = name.utf8(runtime);
  auto &uiManager = *uiManager_;

  // Semantic: Creates a new node with given pieces.
  if (methodName == "createNode") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        5,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.createNode(
                  tagFromValue(runtime, arguments[0]),
                  componentNameFromValue(runtime, arguments[1]),
                  surfaceIdFromValue(runtime, arguments[2]),
                  RawProps(runtime, arguments[3]),
                  eventTargetFromValue(runtime, arguments[4], arguments[0])));
        });
  }

  // Semantic: Clones the node with *same* props and *same* children.
  if (methodName == "cloneNode") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(shadowNodeFromValue(runtime, arguments[0])));
        });
  }

  // Semantic: Clones the node with *same* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildren") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList()));
        });
  }

  // Semantic: Clones the node with *given* props and *same* children.
  if (methodName == "cloneNodeWithNewProps") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          const auto &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  nullptr,
                  &rawProps));
        });
  }

  // Semantic: Clones the node with *given* props and *empty* children.
  if (methodName == "cloneNodeWithNewChildrenAndProps") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          const auto &rawProps = RawProps(runtime, arguments[1]);
          return valueFromShadowNode(
              runtime,
              uiManager.cloneNode(
                  shadowNodeFromValue(runtime, arguments[0]),
                  ShadowNode::emptySharedShadowNodeSharedList(),
                  &rawProps));
        });
  }

  if (methodName == "appendChild") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          uiManager.appendChild(
              shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]));
          return ABI33_0_0jsi::Value::undefined();
        });
  }

  if (methodName == "createChildSet") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [](ABI33_0_0jsi::Runtime &runtime,
           const ABI33_0_0jsi::Value &thisValue,
           const ABI33_0_0jsi::Value *arguments,
           size_t count) -> ABI33_0_0jsi::Value {
          auto shadowNodeList =
              std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
          return valueFromShadowNodeList(runtime, shadowNodeList);
        });
  }

  if (methodName == "appendChildToSet") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [](ABI33_0_0jsi::Runtime &runtime,
           const ABI33_0_0jsi::Value &thisValue,
           const ABI33_0_0jsi::Value *arguments,
           size_t count) -> ABI33_0_0jsi::Value {
          auto shadowNodeList = shadowNodeListFromValue(runtime, arguments[0]);
          auto shadowNode = shadowNodeFromValue(runtime, arguments[1]);
          shadowNodeList->push_back(shadowNode);
          return ABI33_0_0jsi::Value::undefined();
        });
  }

  if (methodName == "completeRoot") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          uiManager.completeSurface(
              surfaceIdFromValue(runtime, arguments[0]),
              shadowNodeListFromValue(runtime, arguments[1]));
          return ABI33_0_0jsi::Value::undefined();
        });
  }

  if (methodName == "registerEventHandler") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [this](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          auto eventHandler =
              arguments[0].getObject(runtime).getFunction(runtime);
          eventHandler_ =
              std::make_unique<EventHandlerWrapper>(std::move(eventHandler));
          return ABI33_0_0jsi::Value::undefined();
        });
  }

  if (methodName == "getRelativeLayoutMetrics") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
              *shadowNodeFromValue(runtime, arguments[0]),
              shadowNodeFromValue(runtime, arguments[1]).get());
          auto frame = layoutMetrics.frame;
          auto result = ABI33_0_0jsi::Object(runtime);
          result.setProperty(runtime, "left", frame.origin.x);
          result.setProperty(runtime, "top", frame.origin.y);
          result.setProperty(runtime, "width", frame.size.width);
          result.setProperty(runtime, "height", frame.size.height);
          return result;
        });
  }

  if (methodName == "setNativeProps") {
    return ABI33_0_0jsi::Function::createFromHostFunction(
        runtime,
        name,
        2,
        [&uiManager](
            ABI33_0_0jsi::Runtime &runtime,
            const ABI33_0_0jsi::Value &thisValue,
            const ABI33_0_0jsi::Value *arguments,
            size_t count) -> ABI33_0_0jsi::Value {
          uiManager.setNativeProps(
              shadowNodeFromValue(runtime, arguments[0]),
              RawProps(runtime, arguments[1]));

          return ABI33_0_0jsi::Value::undefined();
        });
  }

  return ABI33_0_0jsi::Value::undefined();
}

} // namespace ReactABI33_0_0
} // namespace facebook
