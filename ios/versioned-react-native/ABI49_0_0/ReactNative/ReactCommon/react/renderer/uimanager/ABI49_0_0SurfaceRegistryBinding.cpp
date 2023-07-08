/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0SurfaceRegistryBinding.h"
#include <ABI49_0_0React/renderer/debug/ABI49_0_0SystraceSection.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0bindingUtils.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0primitives.h>
#include "ABI49_0_0bindingUtils.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

void SurfaceRegistryBinding::startSurface(
    jsi::Runtime &runtime,
    SurfaceId surfaceId,
    std::string const &moduleName,
    folly::dynamic const &initialProps,
    DisplayMode displayMode) {
  SystraceSection s("SurfaceRegistryBinding::startSurface");
  folly::dynamic parameters = folly::dynamic::object();
  parameters["rootTag"] = surfaceId;
  parameters["initialProps"] = initialProps;
  parameters["fabric"] = true;

  auto global = runtime.global();
  auto isBridgeless = global.hasProperty(runtime, "ABI49_0_0RN$Bridgeless") &&
      global.getProperty(runtime, "ABI49_0_0RN$Bridgeless").asBool();

  if (isBridgeless) {
    if (!global.hasProperty(runtime, "ABI49_0_0RN$SurfaceRegistry")) {
      throw std::runtime_error(
          "SurfaceRegistryBinding::startSurface: Failed to start Surface \"" +
          moduleName + "\". global.ABI49_0_0RN$SurfaceRegistry was not installed.");
    }

    auto registry = global.getPropertyAsObject(runtime, "ABI49_0_0RN$SurfaceRegistry");
    auto method = registry.getPropertyAsFunction(runtime, "renderSurface");
    method.call(
        runtime,
        {jsi::String::createFromUtf8(runtime, moduleName),
         jsi::valueFromDynamic(runtime, parameters),
         jsi::Value(runtime, displayModeToInt(displayMode))});
  } else {
    if (moduleName != "LogBox" &&
        global.hasProperty(runtime, "ABI49_0_0RN$SurfaceRegistry")) {
      auto registry = global.getPropertyAsObject(runtime, "ABI49_0_0RN$SurfaceRegistry");
      auto method = registry.getPropertyAsFunction(runtime, "renderSurface");

      method.call(
          runtime,
          {jsi::String::createFromUtf8(runtime, moduleName),
           jsi::valueFromDynamic(runtime, parameters),
           jsi::Value(runtime, displayModeToInt(displayMode))});
    } else {
      callMethodOfModule(
          runtime,
          "AppRegistry",
          "runApplication",
          {jsi::String::createFromUtf8(runtime, moduleName),
           jsi::valueFromDynamic(runtime, parameters),
           jsi::Value(runtime, displayModeToInt(displayMode))});
    }
  }
}

void SurfaceRegistryBinding::setSurfaceProps(
    jsi::Runtime &runtime,
    SurfaceId surfaceId,
    std::string const &moduleName,
    folly::dynamic const &initialProps,
    DisplayMode displayMode) {
  SystraceSection s("UIManagerBinding::setSurfaceProps");
  folly::dynamic parameters = folly::dynamic::object();
  parameters["rootTag"] = surfaceId;
  parameters["initialProps"] = initialProps;
  parameters["fabric"] = true;

  auto global = runtime.global();
  auto isBridgeless = global.hasProperty(runtime, "ABI49_0_0RN$Bridgeless") &&
      global.getProperty(runtime, "ABI49_0_0RN$Bridgeless").asBool();

  if (isBridgeless) {
    if (!global.hasProperty(runtime, "ABI49_0_0RN$SurfaceRegistry")) {
      throw std::runtime_error(
          "SurfaceRegistryBinding::setSurfaceProps: Failed to set Surface props for \"" +
          moduleName + "\". global.ABI49_0_0RN$SurfaceRegistry was not installed.");
    }

    auto registry = global.getPropertyAsObject(runtime, "ABI49_0_0RN$SurfaceRegistry");
    auto method = registry.getPropertyAsFunction(runtime, "setSurfaceProps");

    method.call(
        runtime,
        {jsi::String::createFromUtf8(runtime, moduleName),
         jsi::valueFromDynamic(runtime, parameters),
         jsi::Value(runtime, displayModeToInt(displayMode))});
  } else {
    if (moduleName != "LogBox" &&
        global.hasProperty(runtime, "ABI49_0_0RN$SurfaceRegistry")) {
      auto registry = global.getPropertyAsObject(runtime, "ABI49_0_0RN$SurfaceRegistry");
      auto method = registry.getPropertyAsFunction(runtime, "setSurfaceProps");

      method.call(
          runtime,
          {jsi::String::createFromUtf8(runtime, moduleName),
           jsi::valueFromDynamic(runtime, parameters),
           jsi::Value(runtime, displayModeToInt(displayMode))});
    } else {
      callMethodOfModule(
          runtime,
          "AppRegistry",
          "setSurfaceProps",
          {jsi::String::createFromUtf8(runtime, moduleName),
           jsi::valueFromDynamic(runtime, parameters),
           jsi::Value(runtime, displayModeToInt(displayMode))});
    }
  }
}

void SurfaceRegistryBinding::stopSurface(
    jsi::Runtime &runtime,
    SurfaceId surfaceId) {
  auto global = runtime.global();
  auto isBridgeless = global.hasProperty(runtime, "ABI49_0_0RN$Bridgeless") &&
      global.getProperty(runtime, "ABI49_0_0RN$Bridgeless").asBool();

  if (isBridgeless) {
    if (!global.hasProperty(runtime, "ABI49_0_0RN$stopSurface")) {
      // ABI49_0_0ReactFabric module has not been loaded yet; there's no surface to stop.
      return;
    }
    // Bridgeless mode uses a custom JSI binding instead of callable module.
    global.getPropertyAsFunction(runtime, "ABI49_0_0RN$stopSurface")
        .call(runtime, {jsi::Value{surfaceId}});
  } else {
    callMethodOfModule(
        runtime,
        "ABI49_0_0ReactFabric",
        "unmountComponentAtNode",
        {jsi::Value{surfaceId}});
  }
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
