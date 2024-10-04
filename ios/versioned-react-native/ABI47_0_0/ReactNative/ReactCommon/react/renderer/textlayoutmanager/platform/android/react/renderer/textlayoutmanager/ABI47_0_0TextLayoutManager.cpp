/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0TextLayoutManager.h"

#include <limits>

#include <ABI47_0_0React/ABI47_0_0common/mapbuffer/JReadableMapBuffer.h>
#include <ABI47_0_0React/ABI47_0_0jni/ReadableNativeMap.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mapbuffer/MapBufferBuilder.h>
#include <ABI47_0_0React/ABI47_0_0renderer/telemetry/TransactionTelemetry.h>

using namespace ABI47_0_0facebook::jni;

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

Size measureAndroidComponent(
    ContextContainer::Shared const &contextContainer,
    Tag rootTag,
    std::string const &componentName,
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
      jni::findClassStatic("com/facebook/ABI47_0_0React/fabric/FabricUIManager")
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
      ReadableNativeMap::newObjectCxxArgs(std::move(localData));
  local_ref<ReadableNativeMap::javaobject> propsRNM =
      ReadableNativeMap::newObjectCxxArgs(std::move(props));
  local_ref<ReadableNativeMap::javaobject> stateRNM =
      ReadableNativeMap::newObjectCxxArgs(std::move(state));

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
    std::string const &componentName,
    MapBuffer localData,
    MapBuffer props,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");
  auto componentNameRef = make_jstring(componentName);

  static auto measure =
      jni::findClassStatic("com/facebook/ABI47_0_0React/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measureMapBuffer");

  auto localDataMap =
      JReadableMapBuffer::createWithContents(std::move(localData));
  auto propsMap = JReadableMapBuffer::createWithContents(std::move(props));

  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      componentNameRef.get(),
      localDataMap.get(),
      propsMap.get(),
      nullptr,
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

TextLayoutManager::TextLayoutManager(
    const ContextContainer::Shared &contextContainer)
    : contextContainer_(contextContainer),
      mapBufferSerializationEnabled_(
          contextContainer->at<bool>("MapBufferSerializationEnabled")),
      measureCache_(
          contextContainer->at<bool>("EnableLargeTextMeasureCache")
              ? 1024
              : kSimpleThreadSafeCacheSizeCap) {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox const &attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  auto &attributedString = attributedStringBox.getValue();

  auto measurement = measureCache_.get(
      {attributedString, paragraphAttributes, layoutConstraints},
      [&](TextMeasureCacheKey const &key) {
        auto telemetry = TransactionTelemetry::threadLocalTelemetry();
        if (telemetry) {
          telemetry->willMeasureText();
        }

        auto measurement = mapBufferSerializationEnabled_
            ? doMeasureMapBuffer(
                  attributedString, paragraphAttributes, layoutConstraints)
            : doMeasure(
                  attributedString, paragraphAttributes, layoutConstraints);

        if (telemetry) {
          telemetry->didMeasureText();
        }

        return measurement;
      });

  measurement.size = layoutConstraints.clamp(measurement.size);
  return measurement;
}

TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t cacheId,
    ParagraphAttributes const &paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(0);
  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  folly::dynamic cacheIdMap = folly::dynamic::object;
  cacheIdMap["cacheId"] = cacheId;

  auto size = measureAndroidComponent(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "ABI47_0_0RCTText",
      std::move(cacheIdMap),
      toDynamic(paragraphAttributes),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  // Clean up allocated ref - it still takes up space in the JNI ref table even
  // though it's 0 length
  env->DeleteLocalRef(attachmentPositions);

  // TODO: currently we do not support attachments for cached IDs - should we?
  auto attachments = TextMeasurement::Attachments{};

  return TextMeasurement{size, attachments};
}

LinesMeasurements TextLayoutManager::measureLines(
    AttributedString const &attributedString,
    ParagraphAttributes const &paragraphAttributes,
    Size size) const {
  if (mapBufferSerializationEnabled_) {
    return measureLinesMapBuffer(attributedString, paragraphAttributes, size);
  }

  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto measureLines =
      jni::findClassStatic("com/facebook/ABI47_0_0React/fabric/FabricUIManager")
          ->getMethod<NativeArray::javaobject(
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat)>("measureLines");

  auto serializedAttributedString = toDynamic(attributedString);

  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(serializedAttributedString);
  local_ref<ReadableNativeMap::javaobject> paragraphAttributesRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes));

  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));
  local_ref<ReadableMap::javaobject> paragraphAttributesRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(paragraphAttributesRNM.get()));

  auto array = measureLines(
      fabricUIManager,
      attributedStringRM.get(),
      paragraphAttributesRM.get(),
      size.width,
      size.height);

  auto dynamicArray = cthis(array)->consume();
  LinesMeasurements lineMeasurements;
  lineMeasurements.reserve(dynamicArray.size());

  for (auto const &data : dynamicArray) {
    lineMeasurements.push_back(LineMeasurement(data));
  }

  // Explicitly release smart pointers to free up space faster in JNI tables
  attributedStringRM.reset();
  attributedStringRNM.reset();
  paragraphAttributesRM.reset();
  paragraphAttributesRNM.reset();

  return lineMeasurements;
}

LinesMeasurements TextLayoutManager::measureLinesMapBuffer(
    AttributedString const &attributedString,
    ParagraphAttributes const &paragraphAttributes,
    Size size) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto measureLines =
      jni::findClassStatic("com/facebook/ABI47_0_0React/fabric/FabricUIManager")
          ->getMethod<NativeArray::javaobject(
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              jfloat,
              jfloat)>("measureLinesMapBuffer");

  auto attributedStringMB =
      JReadableMapBuffer::createWithContents(toMapBuffer(attributedString));
  auto paragraphAttributesMB =
      JReadableMapBuffer::createWithContents(toMapBuffer(paragraphAttributes));

  auto array = measureLines(
      fabricUIManager,
      attributedStringMB.get(),
      paragraphAttributesMB.get(),
      size.width,
      size.height);

  auto dynamicArray = cthis(array)->consume();
  LinesMeasurements lineMeasurements;
  lineMeasurements.reserve(dynamicArray.size());

  for (auto const &data : dynamicArray) {
    lineMeasurements.push_back(LineMeasurement(data));
  }

  // Explicitly release smart pointers to free up space faster in JNI tables
  attributedStringMB.reset();
  paragraphAttributesMB.reset();

  return lineMeasurements;
}

TextMeasurement TextLayoutManager::doMeasure(
    AttributedString attributedString,
    ParagraphAttributes const &paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  layoutConstraints.maximumSize.height = std::numeric_limits<Float>::infinity();

  int attachmentsCount = 0;
  for (auto const &fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      attachmentsCount++;
    }
  }
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentsCount * 2);

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto serializedAttributedString = toDynamic(attributedString);
  auto size = measureAndroidComponent(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "ABI47_0_0RCTText",
      serializedAttributedString,
      toDynamic(paragraphAttributes),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  jfloat *attachmentData =
      env->GetFloatArrayElements(attachmentPositions, nullptr);

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentsCount > 0) {
    folly::dynamic const &fragments = serializedAttributedString["fragments"];
    int attachmentIndex = 0;
    for (auto const &fragment : fragments) {
      auto isAttachment = fragment.find("isAttachment");
      if (isAttachment != fragment.items().end() &&
          isAttachment->second.getBool()) {
        float top = attachmentData[attachmentIndex * 2];
        float left = attachmentData[attachmentIndex * 2 + 1];
        auto width = (float)fragment["width"].getDouble();
        auto height = (float)fragment["height"].getDouble();

        auto rect = ABI47_0_0facebook::ABI47_0_0React::Rect{
            {left, top}, ABI47_0_0facebook::ABI47_0_0React::Size{width, height}};
        attachments.push_back(TextMeasurement::Attachment{rect, false});
        attachmentIndex++;
      }
    }
  }

  // Clean up allocated ref
  env->ReleaseFloatArrayElements(
      attachmentPositions, attachmentData, JNI_ABORT);
  env->DeleteLocalRef(attachmentPositions);

  return TextMeasurement{size, attachments};
}

TextMeasurement TextLayoutManager::doMeasureMapBuffer(
    AttributedString attributedString,
    ParagraphAttributes const &paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  layoutConstraints.maximumSize.height = std::numeric_limits<Float>::infinity();

  int attachmentsCount = 0;
  for (auto const &fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      attachmentsCount++;
    }
  }
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentsCount * 2);

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto attributedStringMap = toMapBuffer(attributedString);
  auto paragraphAttributesMap = toMapBuffer(paragraphAttributes);

  auto size = measureAndroidComponentMapBuffer(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "ABI47_0_0RCTText",
      std::move(attributedStringMap),
      std::move(paragraphAttributesMap),
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  jfloat *attachmentData =
      env->GetFloatArrayElements(attachmentPositions, nullptr);

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentsCount > 0) {
    int attachmentIndex = 0;
    for (const auto &fragment : attributedString.getFragments()) {
      if (fragment.isAttachment()) {
        float top = attachmentData[attachmentIndex * 2];
        float left = attachmentData[attachmentIndex * 2 + 1];
        float width = fragment.parentShadowView.layoutMetrics.frame.size.width;
        float height =
            fragment.parentShadowView.layoutMetrics.frame.size.height;

        auto rect = ABI47_0_0facebook::ABI47_0_0React::Rect{
            {left, top}, ABI47_0_0facebook::ABI47_0_0React::Size{width, height}};
        attachments.push_back(TextMeasurement::Attachment{rect, false});
        attachmentIndex++;
      }
    }
  }

  // Clean up allocated ref
  env->ReleaseFloatArrayElements(
      attachmentPositions, attachmentData, JNI_ABORT);
  env->DeleteLocalRef(attachmentPositions);

  return TextMeasurement{size, attachments};
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
