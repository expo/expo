/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI43_0_0jsi/ABI43_0_0JSIDynamic.h>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/EventHandler.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNode.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

using BackgroundExecutor =
    std::function<void(std::function<void()> &&callback)>;

struct EventHandlerWrapper : public EventHandler {
  EventHandlerWrapper(jsi::Function eventHandler)
      : callback(std::move(eventHandler)) {}

  jsi::Function callback;
};

struct ShadowNodeWrapper : public jsi::HostObject {
  ShadowNodeWrapper(SharedShadowNode shadowNode)
      : shadowNode(std::move(shadowNode)) {}

  ShadowNode::Shared shadowNode;
};

struct ShadowNodeListWrapper : public jsi::HostObject {
  ShadowNodeListWrapper(SharedShadowNodeUnsharedList shadowNodeList)
      : shadowNodeList(shadowNodeList) {}

  SharedShadowNodeUnsharedList shadowNodeList;
};

inline static ShadowNode::Shared shadowNodeFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeWrapper>(runtime)
      ->shadowNode;
}

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime &runtime,
    const ShadowNode::Shared &shadowNode) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_shared<ShadowNodeWrapper>(shadowNode));
}

inline static SharedShadowNodeUnsharedList shadowNodeListFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
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
    jsi::Value const &eventTargetValue,
    jsi::Value const &tagValue) {
  return std::make_shared<EventTarget>(
      runtime, eventTargetValue, tagValue.getNumber());
}

inline static Tag tagFromValue(jsi::Runtime &runtime, jsi::Value const &value) {
  return (Tag)value.getNumber();
}

inline static SurfaceId surfaceIdFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return (SurfaceId)value.getNumber();
}

inline static std::string stringFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return value.getString(runtime).utf8(runtime);
}

inline static folly::dynamic commandArgsFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return jsi::dynamicFromValue(runtime, value);
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
