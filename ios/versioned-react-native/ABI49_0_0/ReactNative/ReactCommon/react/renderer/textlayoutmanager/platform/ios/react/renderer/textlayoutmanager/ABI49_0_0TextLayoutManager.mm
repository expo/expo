/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0TextLayoutManager.h"
#include <ABI49_0_0React/renderer/telemetry/ABI49_0_0TransactionTelemetry.h>
#include <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>

#import "ABI49_0_0RCTTextLayoutManager.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

TextLayoutManager::TextLayoutManager(ContextContainer::Shared const &contextContainer)
{
  self_ = wrapManagedObject([ABI49_0_0RCTTextLayoutManager new]);
}

std::shared_ptr<void> TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(self_ && "Stored NativeTextLayoutManager must not be null.");
  return self_;
}

std::shared_ptr<void> TextLayoutManager::getHostTextStorage(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const
{
  ABI49_0_0RCTTextLayoutManager *textLayoutManager = (ABI49_0_0RCTTextLayoutManager *)unwrapManagedObject(self_);
  CGSize maximumSize = CGSize{layoutConstraints.maximumSize.width, CGFLOAT_MAX};

  NSTextStorage *textStorage = [textLayoutManager textStorageForAttributesString:attributedString
                                                             paragraphAttributes:paragraphAttributes
                                                                            size:maximumSize];
  return wrapManagedObject(textStorage);
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints,
    std::shared_ptr<void> hostTextStorage) const
{
  ABI49_0_0RCTTextLayoutManager *textLayoutManager = (ABI49_0_0RCTTextLayoutManager *)unwrapManagedObject(self_);
  NSTextStorage *textStorage;
  if (hostTextStorage) {
    textStorage = unwrapManagedObject(hostTextStorage);
  }

  auto measurement = TextMeasurement{};

  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value: {
      auto &attributedString = attributedStringBox.getValue();

      measurement = measureCache_.get(
          {attributedString, paragraphAttributes, layoutConstraints}, [&](TextMeasureCacheKey const &key) {
            auto telemetry = TransactionTelemetry::threadLocalTelemetry();
            if (telemetry) {
              telemetry->willMeasureText();
            }

            auto measurement = [textLayoutManager measureAttributedString:attributedString
                                                      paragraphAttributes:paragraphAttributes
                                                        layoutConstraints:layoutConstraints
                                                              textStorage:textStorage];

            if (telemetry) {
              telemetry->didMeasureText();
            }

            return measurement;
          });
      break;
    }

    case AttributedStringBox::Mode::OpaquePointer: {
      NSAttributedString *nsAttributedString =
          (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());

      auto telemetry = TransactionTelemetry::threadLocalTelemetry();
      if (telemetry) {
        telemetry->willMeasureText();
      }

      measurement = [textLayoutManager measureNSAttributedString:nsAttributedString
                                             paragraphAttributes:paragraphAttributes
                                               layoutConstraints:layoutConstraints
                                                     textStorage:textStorage];

      if (telemetry) {
        telemetry->didMeasureText();
      }

      break;
    }
  }

  measurement.size = layoutConstraints.clamp(measurement.size);

  return measurement;
}

LinesMeasurements TextLayoutManager::measureLines(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    Size size) const
{
  ABI49_0_0RCTTextLayoutManager *textLayoutManager = (ABI49_0_0RCTTextLayoutManager *)unwrapManagedObject(self_);
  return [textLayoutManager getLinesForAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                                   size:{size.width, size.height}];
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
