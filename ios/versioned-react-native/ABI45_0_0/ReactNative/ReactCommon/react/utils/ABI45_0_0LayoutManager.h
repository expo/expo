/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0jni/ReadableNativeMap.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/LayoutPrimitives.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/conversions.h>
#ifdef ANDROID
#include <ABI45_0_0React/ABI45_0_0common/mapbuffer/ReadableMapBuffer.h>
#include <ABI45_0_0React/ABI45_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI45_0_0React/ABI45_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif
#include <string>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

#ifdef ANDROID

using namespace ABI45_0_0facebook::jni;

Size measureAndroidComponent(
    const ContextContainer::Shared &contextContainer,
    Tag rootTag,
    std::string componentName,
    folly::dynamic localData,
    folly::dynamic props,
    folly::dynamic state,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/ABI45_0_0React/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measure");

  auto componentNameRef = make_jstring(componentName);
  local_ref<ReadableNativeMap::javaobject> localDataRNM =
      ReadableNativeMap::newObjectCxxArgs(localData);
  local_ref<ReadableNativeMap::javaobject> propsRNM =
      ReadableNativeMap::newObjectCxxArgs(props);
  local_ref<ReadableNativeMap::javaobject> stateRNM =
      ReadableNativeMap::newObjectCxxArgs(state);

  local_ref<ReadableMap::javaobject> localDataRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(localDataRNM.get()));
  local_ref<ReadableMap::javaobject> propsRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(propsRNM.get()));
  local_ref<ReadableMap::javaobject> stateRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(stateRNM.get()));

  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      componentNameRef.get(),
      localDataRM.get(),
      propsRM.get(),
      stateRM.get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      attachmentPositions));

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentNameRef.reset();
  localDataRM.reset();
  localDataRNM.reset();
  propsRM.reset();
  propsRNM.reset();
  stateRM.reset();
  stateRNM.reset();

  return size;
}

Size measureAndroidComponentMapBuffer(
    const ContextContainer::Shared &contextContainer,
    Tag rootTag,
    std::string componentName,
    MapBuffer &localData,
    MapBuffer &props,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");
  auto componentNameRef = make_jstring(componentName);

  static auto measure =
      jni::findClassStatic("com/facebook/ABI45_0_0React/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMapBuffer::javaobject,
              ReadableMapBuffer::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measureMapBuffer");

  auto localDataMap =
      ReadableMapBuffer::createWithContents(std::move(localData));
  auto propsMap = ReadableMapBuffer::createWithContents(std::move(props));

  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      componentNameRef.get(),
      localDataMap.get(),
      propsMap.get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      attachmentPositions));

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentNameRef.reset();
  localDataMap.reset();
  propsMap.reset();
  return size;
}

#endif

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
