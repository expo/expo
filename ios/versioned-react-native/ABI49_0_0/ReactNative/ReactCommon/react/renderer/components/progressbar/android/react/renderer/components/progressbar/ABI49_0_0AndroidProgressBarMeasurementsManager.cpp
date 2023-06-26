/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0AndroidProgressBarMeasurementsManager.h"

#include <fbjni/fbjni.h>
#include <ABI49_0_0React/jni/ABI49_0_0ReadableNativeMap.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0conversions.h>

using namespace ABI49_0_0facebook::jni;

namespace ABI49_0_0facebook::ABI49_0_0React {

Size AndroidProgressBarMeasurementsManager::measure(
    SurfaceId surfaceId,
    AndroidProgressBarProps const &props,
    LayoutConstraints layoutConstraints) const {
  {
    std::lock_guard<std::mutex> lock(mutex_);
    if (hasBeenMeasured_) {
      return cachedMeasurement_;
    }
  }

  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measure = ABI49_0_0facebook::jni::findClassStatic(
                            "com/facebook/ABI49_0_0React/fabric/FabricUIManager")
                            ->getMethod<jlong(
                                jint,
                                jstring,
                                ReadableMap::javaobject,
                                ReadableMap::javaobject,
                                ReadableMap::javaobject,
                                jfloat,
                                jfloat,
                                jfloat,
                                jfloat)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  local_ref<JString> componentName = make_jstring("AndroidProgressBar");

  auto serialiazedProps = toDynamic(props);
  local_ref<ReadableNativeMap::javaobject> propsRNM =
      ReadableNativeMap::newObjectCxxArgs(serialiazedProps);
  local_ref<ReadableMap::javaobject> propsRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(propsRNM.get()));

  auto measurement = yogaMeassureToSize(measure(
      fabricUIManager,
      surfaceId,
      componentName.get(),
      nullptr,
      propsRM.get(),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height));

  std::lock_guard<std::mutex> lock(mutex_);
  cachedMeasurement_ = measurement;
  return measurement;
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
