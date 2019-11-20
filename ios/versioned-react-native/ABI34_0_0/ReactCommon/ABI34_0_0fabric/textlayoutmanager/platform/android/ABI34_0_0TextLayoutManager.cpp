/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0TextLayoutManager.h"

#include <ReactABI34_0_0/attributedstring/conversions.h>
#include <ReactABI34_0_0/core/conversions.h>
#include <ReactABI34_0_0/jni/ReadableNativeMap.h>

using namespace facebook::jni;

namespace facebook {
namespace ReactABI34_0_0 {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->getInstance<jni::global_ref<jobject>>(
          "FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/ReactABI34_0_0/fabric/FabricUIManager")
          ->getMethod<jlong(
              jstring,
              ReadableNativeMap::javaobject,
              ReadableNativeMap::javaobject,
              jint,
              jint,
              jint,
              jint)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;
  int minWidth = (int)minimumSize.width;
  int minHeight = (int)minimumSize.height;
  int maxWidth = (int)maximumSize.width;
  int maxHeight = (int)maximumSize.height;
  local_ref<JString> componentName = make_jstring("ABI34_0_0RCTText");
  return ABI34_0_0yogaMeassureToSize(measure(
      fabricUIManager,
      componentName.get(),
      ReadableNativeMap::newObjectCxxArgs(toDynamic(attributedString)).get(),
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes)).get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight));
}

} // namespace ReactABI34_0_0
} // namespace facebook
