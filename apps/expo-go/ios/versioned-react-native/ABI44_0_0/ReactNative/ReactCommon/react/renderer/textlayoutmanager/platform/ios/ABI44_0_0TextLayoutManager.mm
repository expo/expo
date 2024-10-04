/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0TextLayoutManager.h"
#include <ABI44_0_0React/ABI44_0_0utils/ManagedObjectWrapper.h>

#import "ABI44_0_0RCTTextLayoutManager.h"

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

TextLayoutManager::TextLayoutManager(ContextContainer::Shared const &contextContainer)
{
  self_ = wrapManagedObject([ABI44_0_0RCTTextLayoutManager new]);
}

std::shared_ptr<void> TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(self_ && "Stored NativeTextLayoutManager must not be null.");
  return self_;
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const
{
  ABI44_0_0RCTTextLayoutManager *textLayoutManager = (ABI44_0_0RCTTextLayoutManager *)unwrapManagedObject(self_);

  auto measurement = TextMeasurement{};

  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value: {
      auto &attributedString = attributedStringBox.getValue();

      measurement = measureCache_.get(
          {attributedString, paragraphAttributes, layoutConstraints}, [&](TextMeasureCacheKey const &key) {
            return [textLayoutManager measureAttributedString:attributedString
                                          paragraphAttributes:paragraphAttributes
                                            layoutConstraints:layoutConstraints];
          });
      break;
    }

    case AttributedStringBox::Mode::OpaquePointer: {
      NSAttributedString *nsAttributedString =
          (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());

      measurement = [textLayoutManager measureNSAttributedString:nsAttributedString
                                             paragraphAttributes:paragraphAttributes
                                               layoutConstraints:layoutConstraints];
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
  ABI44_0_0RCTTextLayoutManager *textLayoutManager = (ABI44_0_0RCTTextLayoutManager *)unwrapManagedObject(self_);
  return [textLayoutManager getLinesForAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                                   size:{size.width, size.height}];
}

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
