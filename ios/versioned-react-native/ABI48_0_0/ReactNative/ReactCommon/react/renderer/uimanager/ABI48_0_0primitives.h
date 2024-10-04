/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI48_0_0jsi/ABI48_0_0JSIDynamic.h>
#include <ABI48_0_0jsi/ABI48_0_0jsi.h>
#include <ABI48_0_0React/ABI48_0_0debug/ABI48_0_0React_native_assert.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/EventHandler.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNode.h>

namespace ABI48_0_0facebook::ABI48_0_0React {

using BackgroundExecutor =
    std::function<void(std::function<void()> &&callback)>;

struct EventHandlerWrapper : public EventHandler {
  EventHandlerWrapper(jsi::Function eventHandler)
      : callback(std::move(eventHandler)) {}

  jsi::Function callback;
};

struct ShadowNodeWrapper : public jsi::HostObject {
  ShadowNodeWrapper(ShadowNode::Shared shadowNode)
      : shadowNode(std::move(shadowNode)) {}

  // The below method needs to be implemented out-of-line in order for the class
  // to have at least one "key function" (see
  // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#vague-vtable)
  ~ShadowNodeWrapper() override;

  ShadowNode::Shared shadowNode;
};

struct ShadowNodeListWrapper : public jsi::HostObject {
  ShadowNodeListWrapper(ShadowNode::UnsharedListOfShared shadowNodeList)
      : shadowNodeList(shadowNodeList) {}

  // The below method needs to be implemented out-of-line in order for the class
  // to have at least one "key function" (see
  // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#vague-vtable)
  ~ShadowNodeListWrapper() override;

  ShadowNode::UnsharedListOfShared shadowNodeList;
};

inline static ShadowNode::Shared shadowNodeFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  if (value.isNull()) {
    return nullptr;
  }

  return value.getObject(runtime)
      .getHostObject<ShadowNodeWrapper>(runtime)
      ->shadowNode;
}

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime &runtime,
    ShadowNode::Shared shadowNode) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_shared<ShadowNodeWrapper>(std::move(shadowNode)));
}

inline static ShadowNode::UnsharedListOfShared shadowNodeListFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeListWrapper>(runtime)
      ->shadowNodeList;
}

inline static ShadowNode::UnsharedListOfShared shadowNodeListFromWeakList(
    ShadowNode::UnsharedListOfWeak const &weakShadowNodeList) {
  auto result = std::make_shared<ShadowNode::ListOfShared>();
  for (auto const &weakShadowNode : *weakShadowNodeList) {
    auto sharedShadowNode = weakShadowNode.lock();
    if (!sharedShadowNode) {
      return nullptr;
    }
    result->push_back(sharedShadowNode);
  }
  return result;
}

inline static ShadowNode::UnsharedListOfWeak weakShadowNodeListFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  auto shadowNodeList = value.getObject(runtime)
                            .getHostObject<ShadowNodeListWrapper>(runtime)
                            ->shadowNodeList;

  auto weakShadowNodeList = std::make_shared<ShadowNode::ListOfWeak>();
  for (auto const &shadowNode : *shadowNodeList) {
    weakShadowNodeList->push_back(shadowNode);
  }

  return weakShadowNodeList;
}

inline static jsi::Value valueFromShadowNodeList(
    jsi::Runtime &runtime,
    const ShadowNode::UnsharedListOfShared &shadowNodeList) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_unique<ShadowNodeListWrapper>(shadowNodeList));
}

inline static Tag tagFromValue(jsi::Value const &value) {
  return (Tag)value.getNumber();
}

inline static SharedEventTarget eventTargetFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &eventTargetValue,
    jsi::Value const &tagValue) {
  ABI48_0_0React_native_assert(!eventTargetValue.isNull());
  if (eventTargetValue.isNull()) {
    return nullptr;
  }
  return std::make_shared<EventTarget>(
      runtime, eventTargetValue, tagFromValue(tagValue));
}

inline static SurfaceId surfaceIdFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return (SurfaceId)value.getNumber();
}

inline static int displayModeToInt(DisplayMode const value) {
  // the result of this method should be in sync with
  // Libraries/ABI48_0_0ReactNative/DisplayMode.js
  switch (value) {
    case DisplayMode::Visible:
      return 1;
    case DisplayMode::Suspended:
      return 2;
    case DisplayMode::Hidden:
      return 3;
  }
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

} // namespace ABI48_0_0facebook::ABI48_0_0React
