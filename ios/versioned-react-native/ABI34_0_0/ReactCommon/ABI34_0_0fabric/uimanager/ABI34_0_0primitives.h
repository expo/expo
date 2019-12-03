// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/dynamic.h>
#include <ABI34_0_0jsi/ABI34_0_0JSIDynamic.h>
#include <ABI34_0_0jsi/ABI34_0_0jsi.h>
#include <ReactABI34_0_0/core/ShadowNode.h>

namespace facebook {
namespace ReactABI34_0_0 {

using RuntimeExecutor = std::function<void(
    std::function<void(facebook::jsi::Runtime &runtime)> &&callback)>;

struct EventHandlerWrapper : public EventHandler {
  EventHandlerWrapper(jsi::Function eventHandler)
      : callback(std::move(eventHandler)) {}

  jsi::Function callback;
};

struct ShadowNodeWrapper : public jsi::HostObject {
  ShadowNodeWrapper(SharedShadowNode shadowNode)
      : shadowNode(std::move(shadowNode)) {}

  SharedShadowNode shadowNode;
};

struct ShadowNodeListWrapper : public jsi::HostObject {
  ShadowNodeListWrapper(SharedShadowNodeUnsharedList shadowNodeList)
      : shadowNodeList(shadowNodeList) {}

  SharedShadowNodeUnsharedList shadowNodeList;
};

inline static SharedShadowNode shadowNodeFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeWrapper>(runtime)
      ->shadowNode;
}

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime &runtime,
    const SharedShadowNode &shadowNode) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_shared<ShadowNodeWrapper>(shadowNode));
}

inline static SharedShadowNodeUnsharedList shadowNodeListFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeListWrapper>(runtime)
      ->shadowNodeList;
}

inline static jsi::Value valueFromShadowNodeList(
    jsi::Runtime &runtime,
    const SharedShadowNodeUnsharedList &shadowNodeList) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_unique<ShadowNodeListWrapper>(shadowNodeList));
}

inline static SharedEventTarget eventTargetFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &eventTargetValue,
    const jsi::Value &tagValue) {
  return std::make_shared<EventTarget>(
      runtime, eventTargetValue, tagValue.getNumber());
}

inline static Tag tagFromValue(jsi::Runtime &runtime, const jsi::Value &value) {
  return (Tag)value.getNumber();
}

inline static SurfaceId surfaceIdFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return (SurfaceId)value.getNumber();
}

inline static ComponentName componentNameFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return value.getString(runtime).utf8(runtime);
}

} // namespace ReactABI34_0_0
} // namespace facebook
