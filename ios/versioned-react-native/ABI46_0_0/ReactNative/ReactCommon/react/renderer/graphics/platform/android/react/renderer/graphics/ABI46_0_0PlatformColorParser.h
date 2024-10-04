/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <ABI46_0_0React/ABI46_0_0jni/ReadableNativeMap.h>
#include <ABI46_0_0React/ABI46_0_0renderer/core/PropsParserContext.h>
#include <ABI46_0_0React/ABI46_0_0renderer/core/RawProps.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/ColorComponents.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

inline ColorComponents parsePlatformColor(
    const PropsParserContext &context,
    const RawValue &value) {
  ColorComponents colorComponents = {0, 0, 0, 0};

  if (value.hasType<butter::map<std::string, std::vector<std::string>>>()) {
    auto map = (butter::map<std::string, std::vector<std::string>>)value;
    auto resourcePaths = map["resource_paths"];
    auto dynamicResourcePaths = folly::dynamic::array();
    for (const auto &resourcePath : resourcePaths) {
      dynamicResourcePaths.push_back(resourcePath);
    }
    folly::dynamic dynamicPlatformColor = folly::dynamic::object();
    dynamicPlatformColor["resource_paths"] = dynamicResourcePaths;

    auto fabricUIManager =
        context.contextContainer.at<jni::global_ref<jobject>>(
            "FabricUIManager");

    static auto getColorFromJava =
        ABI46_0_0facebook::jni::findClassStatic(
            "com/facebook/ABI46_0_0React/fabric/FabricUIManager")
            ->getMethod<jint(jint, ReadableMap::javaobject)>("getColor");

    jni::local_ref<ReadableNativeMap::javaobject> dynamicPlatformColorRNM =
        ReadableNativeMap::newObjectCxxArgs(dynamicPlatformColor);
    jni::local_ref<ReadableMap::javaobject> dynamicPlatformColorRM =
        jni::make_local(reinterpret_cast<ReadableMap::javaobject>(
            dynamicPlatformColorRNM.get()));

    auto color = getColorFromJava(
        fabricUIManager, context.surfaceId, dynamicPlatformColorRM.get());

    dynamicPlatformColorRM.reset();
    dynamicPlatformColorRNM.reset();

    auto argb = (int64_t)color;
    auto ratio = 255.f;
    colorComponents.alpha = ((argb >> 24) & 0xFF) / ratio;
    colorComponents.red = ((argb >> 16) & 0xFF) / ratio;
    colorComponents.green = ((argb >> 8) & 0xFF) / ratio;
    colorComponents.blue = (argb & 0xFF) / ratio;
  }

  return colorComponents;
}

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
