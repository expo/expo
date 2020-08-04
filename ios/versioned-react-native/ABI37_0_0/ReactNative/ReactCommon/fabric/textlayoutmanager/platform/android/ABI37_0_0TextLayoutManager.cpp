/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0TextLayoutManager.h"

#include <ABI37_0_0React/attributedstring/conversions.h>
#include <ABI37_0_0React/core/conversions.h>
#include <ABI37_0_0React/jni/ReadableNativeMap.h>

using namespace ABI37_0_0facebook::jni;

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
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

  local_ref<JString> componentName = make_jstring("ABI37_0_0RCTText");
  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(attributedString));
  local_ref<ReadableNativeMap::javaobject> paragraphAttributesRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes));

  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));
  local_ref<ReadableMap::javaobject> paragraphAttributesRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(paragraphAttributesRNM.get()));
  return yogaMeassureToSize(measure(
      fabricUIManager,
      componentName.get(),
      attributedStringRM.get(),
      paragraphAttributesRM.get(),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height));
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
