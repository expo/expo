
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/components/view/AccessibilityPrimitives.h>
#import <ABI37_0_0React/components/view/primitives.h>
#import <ABI37_0_0React/graphics/Color.h>
#import <ABI37_0_0React/graphics/Geometry.h>
#import <ABI37_0_0React/graphics/Transform.h>

NS_ASSUME_NONNULL_BEGIN

inline NSString *ABI37_0_0RCTNSStringFromString(const std::string &string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [NSString stringWithCString:string.c_str() encoding:encoding];
}

inline NSString *_Nullable ABI37_0_0RCTNSStringFromStringNilIfEmpty(const std::string &string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return string.empty() ? nil : ABI37_0_0RCTNSStringFromString(string, encoding);
}

inline std::string ABI37_0_0RCTStringFromNSString(NSString *string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [string cStringUsingEncoding:encoding];
}

inline UIColor *_Nullable ABI37_0_0RCTUIColorFromSharedColor(const ABI37_0_0facebook::ABI37_0_0React::SharedColor &sharedColor) {
  return sharedColor ? [UIColor colorWithCGColor:sharedColor.get()] : nil;
}


inline CF_RETURNS_NOT_RETAINED CGColorRef ABI37_0_0RCTCGColorRefUnretainedFromSharedColor(const ABI37_0_0facebook::ABI37_0_0React::SharedColor &sharedColor) {
  return sharedColor ? sharedColor.get() : nil;
}


inline CF_RETURNS_RETAINED CGColorRef ABI37_0_0RCTCGColorRefFromSharedColor(const ABI37_0_0facebook::ABI37_0_0React::SharedColor &sharedColor) {
  return sharedColor ? CGColorCreateCopy(sharedColor.get()) : nil;
}

inline CGPoint ABI37_0_0RCTCGPointFromPoint(const ABI37_0_0facebook::ABI37_0_0React::Point &point) {
  return {point.x, point.y};
}

inline CGSize ABI37_0_0RCTCGSizeFromSize(const ABI37_0_0facebook::ABI37_0_0React::Size &size) {
  return {size.width, size.height};
}

inline CGRect ABI37_0_0RCTCGRectFromRect(const ABI37_0_0facebook::ABI37_0_0React::Rect &rect) {
  return {ABI37_0_0RCTCGPointFromPoint(rect.origin), ABI37_0_0RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets ABI37_0_0RCTUIEdgeInsetsFromEdgeInsets(const ABI37_0_0facebook::ABI37_0_0React::EdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

inline UIAccessibilityTraits ABI37_0_0RCTUIAccessibilityTraitsFromAccessibilityTraits(ABI37_0_0facebook::ABI37_0_0React::AccessibilityTraits accessibilityTraits) {
  using AccessibilityTraits = ABI37_0_0facebook::ABI37_0_0React::AccessibilityTraits;
  UIAccessibilityTraits result = UIAccessibilityTraitNone;
  if ((accessibilityTraits & AccessibilityTraits::Button) != AccessibilityTraits::None) { result |= UIAccessibilityTraitButton; }
  if ((accessibilityTraits & AccessibilityTraits::Link) != AccessibilityTraits::None) { result |= UIAccessibilityTraitLink; }
  if ((accessibilityTraits & AccessibilityTraits::Image) != AccessibilityTraits::None) { result |= UIAccessibilityTraitImage; }
  if ((accessibilityTraits & AccessibilityTraits::Selected) != AccessibilityTraits::None) { result |= UIAccessibilityTraitSelected; }
  if ((accessibilityTraits & AccessibilityTraits::PlaysSound) != AccessibilityTraits::None) { result |= UIAccessibilityTraitPlaysSound; }
  if ((accessibilityTraits & AccessibilityTraits::KeyboardKey) != AccessibilityTraits::None) { result |= UIAccessibilityTraitKeyboardKey; }
  if ((accessibilityTraits & AccessibilityTraits::StaticText) != AccessibilityTraits::None) { result |= UIAccessibilityTraitStaticText; }
  if ((accessibilityTraits & AccessibilityTraits::SummaryElement) != AccessibilityTraits::None) { result |= UIAccessibilityTraitSummaryElement; }
  if ((accessibilityTraits & AccessibilityTraits::NotEnabled) != AccessibilityTraits::None) { result |= UIAccessibilityTraitNotEnabled; }
  if ((accessibilityTraits & AccessibilityTraits::UpdatesFrequently) != AccessibilityTraits::None) { result |= UIAccessibilityTraitUpdatesFrequently; }
  if ((accessibilityTraits & AccessibilityTraits::SearchField) != AccessibilityTraits::None) { result |= UIAccessibilityTraitSearchField; }
  if ((accessibilityTraits & AccessibilityTraits::StartsMediaSession) != AccessibilityTraits::None) { result |= UIAccessibilityTraitStartsMediaSession; }
  if ((accessibilityTraits & AccessibilityTraits::Adjustable) != AccessibilityTraits::None) { result |= UIAccessibilityTraitAdjustable; }
  if ((accessibilityTraits & AccessibilityTraits::AllowsDirectInteraction) != AccessibilityTraits::None) { result |= UIAccessibilityTraitAllowsDirectInteraction; }
  if ((accessibilityTraits & AccessibilityTraits::CausesPageTurn) != AccessibilityTraits::None) { result |= UIAccessibilityTraitCausesPageTurn; }
  if ((accessibilityTraits & AccessibilityTraits::Header) != AccessibilityTraits::None) { result |= UIAccessibilityTraitHeader; }
  return result;
};

inline CATransform3D ABI37_0_0RCTCATransform3DFromTransformMatrix(const ABI37_0_0facebook::ABI37_0_0React::Transform &transformMatrix) {
  return {
    (CGFloat)transformMatrix.matrix[0],
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
    (CGFloat)transformMatrix.matrix[15]
  };
}

inline ABI37_0_0facebook::ABI37_0_0React::Point ABI37_0_0RCTPointFromCGPoint(const CGPoint &point) {
  return {point.x, point.y};
}

inline ABI37_0_0facebook::ABI37_0_0React::Size ABI37_0_0RCTSizeFromCGSize(const CGSize &size) {
  return {size.width, size.height};
}

inline ABI37_0_0facebook::ABI37_0_0React::Rect ABI37_0_0RCTRectFromCGRect(const CGRect &rect) {
  return {ABI37_0_0RCTPointFromCGPoint(rect.origin), ABI37_0_0RCTSizeFromCGSize(rect.size)};
}

inline ABI37_0_0facebook::ABI37_0_0React::EdgeInsets ABI37_0_0RCTEdgeInsetsFromUIEdgeInsets(const UIEdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

NS_ASSUME_NONNULL_END
