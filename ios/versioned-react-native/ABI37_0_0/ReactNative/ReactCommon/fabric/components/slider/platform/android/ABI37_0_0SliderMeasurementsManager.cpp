/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0SliderMeasurementsManager.h"

#include <fb/fbjni.h>
#include <ABI37_0_0React/core/conversions.h>
#include <ABI37_0_0React/jni/ReadableNativeMap.h>

using namespace ABI37_0_0facebook::jni;

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

Size SliderMeasurementsManager::measure(
    LayoutConstraints layoutConstraints) const {
  {
    std::lock_guard<std::mutex> lock(mutex_);
    if (hasBeenMeasured_) {
      return cachedMeasurement_;
    }
  }

  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/ABI37_0_0React/fabric/FabricUIManager")
          ->getMethod<jlong(
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

  local_ref<JString> componentName = make_jstring("ABI37_0_0RCTSlider");

  auto measurement = yogaMeassureToSize(measure(
      fabricUIManager,
      componentName.get(),
      nullptr,
      nullptr,
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height));

  std::lock_guard<std::mutex> lock(mutex_);
  cachedMeasurement_ = measurement;
  return measurement;
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
