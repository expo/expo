/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/components/view/primitives.h>
#import <ReactABI34_0_0/components/view/AccessibilityPrimitives.h>
#import <ReactABI34_0_0/graphics/Color.h>
#import <ReactABI34_0_0/graphics/Geometry.h>

NS_ASSUME_NONNULL_BEGIN

inline NSString *ABI34_0_0RCTNSStringFromString(const std::string &string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [NSString stringWithCString:string.c_str() encoding:encoding];
}

inline NSString *_Nullable ABI34_0_0RCTNSStringFromStringNilIfEmpty(const std::string &string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return string.empty() ? nil : ABI34_0_0RCTNSStringFromString(string, encoding);
}

inline std::string ABI34_0_0RCTStringFromNSString(NSString *string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [string cStringUsingEncoding:encoding];
}

inline UIColor *_Nullable ABI34_0_0RCTUIColorFromSharedColor(const facebook::ReactABI34_0_0::SharedColor &sharedColor) {
  return sharedColor ? [UIColor colorWithCGColor:sharedColor.get()] : nil;
}

inline CGColorRef ABI34_0_0RCTCGColorRefFromSharedColor(const facebook::ReactABI34_0_0::SharedColor &sharedColor) {
  return sharedColor ? CGColorCreateCopy(sharedColor.get()) : nil;
}

inline CGPoint ABI34_0_0RCTCGPointFromPoint(const facebook::ReactABI34_0_0::Point &point) {
  return {point.x, point.y};
}

inline CGSize ABI34_0_0RCTCGSizeFromSize(const facebook::ReactABI34_0_0::Size &size) {
  return {size.width, size.height};
}

inline CGRect ABI34_0_0RCTCGRectFromRect(const facebook::ReactABI34_0_0::Rect &rect) {
  return {ABI34_0_0RCTCGPointFromPoint(rect.origin), ABI34_0_0RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets ABI34_0_0RCTUIEdgeInsetsFromEdgeInsets(const facebook::ReactABI34_0_0::EdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

inline UIAccessibilityTraits ABI34_0_0RCTUIAccessibilityTraitsFromAccessibilityTraits(facebook::ReactABI34_0_0::AccessibilityTraits accessibilityTraits) {
  using AccessibilityTraits = facebook::ReactABI34_0_0::AccessibilityTraits;
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

inline CATransform3D ABI34_0_0RCTCATransform3DFromTransformMatrix(const facebook::ReactABI34_0_0::Transform &transformMatrix) {
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

inline facebook::ReactABI34_0_0::Point ABI34_0_0RCTPointFromCGPoint(const CGPoint &point) {
  return {point.x, point.y};
}

inline facebook::ReactABI34_0_0::Size ABI34_0_0RCTSizeFromCGSize(const CGSize &size) {
  return {size.width, size.height};
}

inline facebook::ReactABI34_0_0::Rect ABI34_0_0RCTRectFromCGRect(const CGRect &rect) {
  return {ABI34_0_0RCTPointFromCGPoint(rect.origin), ABI34_0_0RCTSizeFromCGSize(rect.size)};
}

inline facebook::ReactABI34_0_0::EdgeInsets ABI34_0_0RCTEdgeInsetsFromUIEdgeInsets(const UIEdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

NS_ASSUME_NONNULL_END
