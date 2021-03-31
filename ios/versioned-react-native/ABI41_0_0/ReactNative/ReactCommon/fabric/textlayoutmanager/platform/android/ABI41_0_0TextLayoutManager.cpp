/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0TextLayoutManager.h"

#include <ABI41_0_0React/attributedstring/conversions.h>
#include <ABI41_0_0React/core/conversions.h>
#include <ABI41_0_0React/jni/ReadableNativeMap.h>

using namespace ABI41_0_0facebook::jni;

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  auto &attributedString = attributedStringBox.getValue();

  return measureCache_.get(
      {attributedString, paragraphAttributes, layoutConstraints},
      [&](TextMeasureCacheKey const &key) {
        return doMeasure(
            attributedString, paragraphAttributes, layoutConstraints);
      });
}

TextMeasurement TextLayoutManager::doMeasure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  int attachmentsCount = 0;
  for (auto fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      attachmentsCount++;
    }
  }
  auto env = Environment::current();
  auto attachmentPositions = env->NewIntArray(attachmentsCount * 2);

  static auto measure =
      jni::findClassStatic("com/facebook/ABI41_0_0React/fabric/FabricUIManager")
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
              jintArray)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto serializedAttributedString = toDynamic(attributedString);
  local_ref<JString> componentName = make_jstring("ABI41_0_0RCTText");
  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(serializedAttributedString);
  local_ref<ReadableNativeMap::javaobject> paragraphAttributesRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes));

  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));
  local_ref<ReadableMap::javaobject> paragraphAttributesRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(paragraphAttributesRNM.get()));
  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      -1,
      componentName.get(),
      attributedStringRM.get(),
      paragraphAttributesRM.get(),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions));

  jint *attachmentData = env->GetIntArrayElements(attachmentPositions, 0);

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentsCount > 0) {
    folly::dynamic fragments = serializedAttributedString["fragments"];
    int attachmentIndex = 0;
    for (int i = 0; i < fragments.size(); i++) {
      folly::dynamic fragment = fragments[i];
      if (fragment["isAttachment"] == true) {
        float top = attachmentData[attachmentIndex * 2];
        float left = attachmentData[attachmentIndex * 2 + 1];
        float width = fragment["width"].getInt();
        float height = fragment["height"].getInt();

        auto rect = ABI41_0_0facebook::ABI41_0_0React::Rect{{left, top},
                                          ABI41_0_0facebook::ABI41_0_0React::Size{width, height}};
        attachments.push_back(TextMeasurement::Attachment{rect, false});
        attachmentIndex++;
      }
    }
  }
  // DELETE REF
  env->DeleteLocalRef(attachmentPositions);
  return TextMeasurement{size, attachments};
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
