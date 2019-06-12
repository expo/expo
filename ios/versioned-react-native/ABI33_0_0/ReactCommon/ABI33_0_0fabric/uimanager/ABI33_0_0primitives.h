// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/dynamic.h>
#include <ABI33_0_0jsi/ABI33_0_0JSIDynamic.h>
#include <ABI33_0_0jsi/ABI33_0_0jsi.h>
#include <ReactABI33_0_0/core/ShadowNode.h>

namespace facebook {
namespace ReactABI33_0_0 {

using RuntimeExecutor = std::function<void(
    std::function<void(facebook::ABI33_0_0jsi::Runtime &runtime)> &&callback)>;

struct EventHandlerWrapper : public EventHandler {
  EventHandlerWrapper(ABI33_0_0jsi::Function eventHandler)
      : callback(std::move(eventHandler)) {}

  ABI33_0_0jsi::Function callback;
};

struct ShadowNodeWrapper : public ABI33_0_0jsi::HostObject {
  ShadowNodeWrapper(SharedShadowNode shadowNode)
      : shadowNode(std::move(shadowNode)) {}

  SharedShadowNode shadowNode;
};

struct ShadowNodeListWrapper : public ABI33_0_0jsi::HostObject {
  ShadowNodeListWrapper(SharedShadowNodeUnsharedList shadowNodeList)
      : shadowNodeList(shadowNodeList) {}

  SharedShadowNodeUnsharedList shadowNodeList;
};

inline static SharedShadowNode shadowNodeFromValue(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::Value &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeWrapper>(runtime)
      ->shadowNode;
}

inline static ABI33_0_0jsi::Value valueFromShadowNode(
    ABI33_0_0jsi::Runtime &runtime,
    const SharedShadowNode &shadowNode) {
  return ABI33_0_0jsi::Object::createFromHostObject(
      runtime, std::make_shared<ShadowNodeWrapper>(shadowNode));
}

inline static SharedShadowNodeUnsharedList shadowNodeListFromValue(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::Value &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeListWrapper>(runtime)
      ->shadowNodeList;
}

inline static ABI33_0_0jsi::Value valueFromShadowNodeList(
    ABI33_0_0jsi::Runtime &runtime,
    const SharedShadowNodeUnsharedList &shadowNodeList) {
  return ABI33_0_0jsi::Object::createFromHostObject(
      runtime, std::make_unique<ShadowNodeListWrapper>(shadowNodeList));
}

inline static SharedEventTarget eventTargetFromValue(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::Value &eventTargetValue,
    const ABI33_0_0jsi::Value &tagValue) {
  return std::make_shared<EventTarget>(
      runtime, eventTargetValue, tagValue.getNumber());
}

inline static Tag tagFromValue(ABI33_0_0jsi::Runtime &runtime, const ABI33_0_0jsi::Value &value) {
  return (Tag)value.getNumber();
}

inline static SurfaceId surfaceIdFromValue(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::Value &value) {
  return (SurfaceId)value.getNumber();
}

inline static ComponentName componentNameFromValue(
    ABI33_0_0jsi::Runtime &runtime,
    const ABI33_0_0jsi::Value &value) {
  return value.getString(runtime).utf8(runtime);
}

} // namespace ReactABI33_0_0
} // namespace facebook
