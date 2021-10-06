/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0renderer/components/view/AccessibilityPrimitives.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/view/primitives.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/LayoutPrimitives.h>
#import <ABI43_0_0React/ABI43_0_0renderer/graphics/Color.h>
#import <ABI43_0_0React/ABI43_0_0renderer/graphics/Geometry.h>
#import <ABI43_0_0React/ABI43_0_0renderer/graphics/Transform.h>

NS_ASSUME_NONNULL_BEGIN

inline NSString *ABI43_0_0RCTNSStringFromString(
    const std::string &string,
    const NSStringEncoding &encoding = NSUTF8StringEncoding)
{
  return [NSString stringWithCString:string.c_str() encoding:encoding];
}

inline NSString *_Nullable ABI43_0_0RCTNSStringFromStringNilIfEmpty(
    const std::string &string,
    const NSStringEncoding &encoding = NSUTF8StringEncoding)
{
  return string.empty() ? nil : ABI43_0_0RCTNSStringFromString(string, encoding);
}

inline std::string ABI43_0_0RCTStringFromNSString(NSString *string)
{
  return std::string{string.UTF8String ?: ""};
}

inline UIColor *_Nullable ABI43_0_0RCTUIColorFromSharedColor(ABI43_0_0facebook::ABI43_0_0React::SharedColor const &sharedColor)
{
  if (!sharedColor) {
    return nil;
  }

  if (*ABI43_0_0facebook::ABI43_0_0React::clearColor() == *sharedColor) {
    return [UIColor clearColor];
  }

  if (*ABI43_0_0facebook::ABI43_0_0React::blackColor() == *sharedColor) {
    return [UIColor blackColor];
  }

  if (*ABI43_0_0facebook::ABI43_0_0React::whiteColor() == *sharedColor) {
    return [UIColor whiteColor];
  }

  auto components = ABI43_0_0facebook::ABI43_0_0React::colorComponentsFromColor(sharedColor);
  return [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
}

inline CF_RETURNS_RETAINED CGColorRef
ABI43_0_0RCTCreateCGColorRefFromSharedColor(const ABI43_0_0facebook::ABI43_0_0React::SharedColor &sharedColor)
{
  return CGColorRetain(ABI43_0_0RCTUIColorFromSharedColor(sharedColor).CGColor);
}

inline CGPoint ABI43_0_0RCTCGPointFromPoint(const ABI43_0_0facebook::ABI43_0_0React::Point &point)
{
  return {point.x, point.y};
}

inline CGSize ABI43_0_0RCTCGSizeFromSize(const ABI43_0_0facebook::ABI43_0_0React::Size &size)
{
  return {size.width, size.height};
}

inline CGRect ABI43_0_0RCTCGRectFromRect(const ABI43_0_0facebook::ABI43_0_0React::Rect &rect)
{
  return {ABI43_0_0RCTCGPointFromPoint(rect.origin), ABI43_0_0RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets ABI43_0_0RCTUIEdgeInsetsFromEdgeInsets(const ABI43_0_0facebook::ABI43_0_0React::EdgeInsets &edgeInsets)
{
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

UIAccessibilityTraits const AccessibilityTraitSwitch = 0x20000000000001;

inline UIAccessibilityTraits ABI43_0_0RCTUIAccessibilityTraitsFromAccessibilityTraits(
    ABI43_0_0facebook::ABI43_0_0React::AccessibilityTraits accessibilityTraits)
{
  using AccessibilityTraits = ABI43_0_0facebook::ABI43_0_0React::AccessibilityTraits;
  UIAccessibilityTraits result = UIAccessibilityTraitNone;
  if ((accessibilityTraits & AccessibilityTraits::Button) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitButton;
  }
  if ((accessibilityTraits & AccessibilityTraits::Link) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitLink;
  }
  if ((accessibilityTraits & AccessibilityTraits::Image) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitImage;
  }
  if ((accessibilityTraits & AccessibilityTraits::Selected) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitSelected;
  }
  if ((accessibilityTraits & AccessibilityTraits::PlaysSound) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitPlaysSound;
  }
  if ((accessibilityTraits & AccessibilityTraits::KeyboardKey) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitKeyboardKey;
  }
  if ((accessibilityTraits & AccessibilityTraits::StaticText) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitStaticText;
  }
  if ((accessibilityTraits & AccessibilityTraits::SummaryElement) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitSummaryElement;
  }
  if ((accessibilityTraits & AccessibilityTraits::NotEnabled) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitNotEnabled;
  }
  if ((accessibilityTraits & AccessibilityTraits::UpdatesFrequently) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitUpdatesFrequently;
  }
  if ((accessibilityTraits & AccessibilityTraits::SearchField) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitSearchField;
  }
  if ((accessibilityTraits & AccessibilityTraits::StartsMediaSession) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitStartsMediaSession;
  }
  if ((accessibilityTraits & AccessibilityTraits::Adjustable) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitAdjustable;
  }
  if ((accessibilityTraits & AccessibilityTraits::AllowsDirectInteraction) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitAllowsDirectInteraction;
  }
  if ((accessibilityTraits & AccessibilityTraits::CausesPageTurn) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitCausesPageTurn;
  }
  if ((accessibilityTraits & AccessibilityTraits::Header) != AccessibilityTraits::None) {
    result |= UIAccessibilityTraitHeader;
  }
  if ((accessibilityTraits & AccessibilityTraits::Switch) != AccessibilityTraits::None) {
    result |= AccessibilityTraitSwitch;
  }
  return result;
};

inline CATransform3D ABI43_0_0RCTCATransform3DFromTransformMatrix(const ABI43_0_0facebook::ABI43_0_0React::Transform &transformMatrix)
{
  return {(CGFloat)transformMatrix.matrix[0],
          (CGFloat)transformMatrix.matrix[1],
          (CGFloat)transformMatrix.matrix[2],
          (CGFloat)transformMatrix.matrix[3],
          (CGFloat)transformMatrix.matrix[4],
          (CGFloat)transformMatrix.matrix[5],
          (CGFloat)transformMatrix.matrix[6],
          (CGFloat)transformMatrix.matrix[7],
          (CGFloat)transformMatrix.matrix[8],
          (CGFloat)transformMatrix.matrix[9],
          (CGFloat)transformMatrix.matrix[10],
          (CGFloat)transformMatrix.matrix[11],
          (CGFloat)transformMatrix.matrix[12],
          (CGFloat)transformMatrix.matrix[13],
          (CGFloat)transformMatrix.matrix[14],
          (CGFloat)transformMatrix.matrix[15]};
}

inline ABI43_0_0facebook::ABI43_0_0React::Point ABI43_0_0RCTPointFromCGPoint(const CGPoint &point)
{
  return {point.x, point.y};
}

inline ABI43_0_0facebook::ABI43_0_0React::Size ABI43_0_0RCTSizeFromCGSize(const CGSize &size)
{
  return {size.width, size.height};
}

inline ABI43_0_0facebook::ABI43_0_0React::Rect ABI43_0_0RCTRectFromCGRect(const CGRect &rect)
{
  return {ABI43_0_0RCTPointFromCGPoint(rect.origin), ABI43_0_0RCTSizeFromCGSize(rect.size)};
}

inline ABI43_0_0facebook::ABI43_0_0React::EdgeInsets ABI43_0_0RCTEdgeInsetsFromUIEdgeInsets(const UIEdgeInsets &edgeInsets)
{
  return {edgeInsets.left, edgeInsets.top, edgeInsets.right, edgeInsets.bottom};
}

inline ABI43_0_0facebook::ABI43_0_0React::LayoutDirection ABI43_0_0RCTLayoutDirection(BOOL isRTL)
{
  return isRTL ? ABI43_0_0facebook::ABI43_0_0React::LayoutDirection::RightToLeft : ABI43_0_0facebook::ABI43_0_0React::LayoutDirection::LeftToRight;
}

NS_ASSUME_NONNULL_END
