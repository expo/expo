/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI31_0_0fabric/ABI31_0_0components/view/primitives.h>
#import <ABI31_0_0fabric/ABI31_0_0graphics/Color.h>
#import <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>

inline NSString *_Nullable ABI31_0_0RCTNSStringFromString(const std::string &string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [NSString stringWithCString:string.c_str() encoding:encoding];
}

inline std::string ABI31_0_0RCTStringFromNSString(NSString *string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [string cStringUsingEncoding:encoding];
}

inline UIColor *_Nullable ABI31_0_0RCTUIColorFromSharedColor(const facebook::ReactABI31_0_0::SharedColor &sharedColor) {
  return sharedColor ? [UIColor colorWithCGColor:sharedColor.get()] : nil;
}

inline CGColorRef ABI31_0_0RCTCGColorRefFromSharedColor(const facebook::ReactABI31_0_0::SharedColor &sharedColor) {
  return sharedColor ? CGColorCreateCopy(sharedColor.get()) : nil;
}

inline CGPoint ABI31_0_0RCTCGPointFromPoint(const facebook::ReactABI31_0_0::Point &point) {
  return {point.x, point.y};
}

inline CGSize ABI31_0_0RCTCGSizeFromSize(const facebook::ReactABI31_0_0::Size &size) {
  return {size.width, size.height};
}

inline CGRect ABI31_0_0RCTCGRectFromRect(const facebook::ReactABI31_0_0::Rect &rect) {
  return {ABI31_0_0RCTCGPointFromPoint(rect.origin), ABI31_0_0RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets ABI31_0_0RCTUIEdgeInsetsFromEdgeInsets(const facebook::ReactABI31_0_0::EdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}


inline CATransform3D ABI31_0_0RCTCATransform3DFromTransformMatrix(const facebook::ReactABI31_0_0::Transform &transformMatrix) {
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

inline facebook::ReactABI31_0_0::Point ABI31_0_0RCTPointFromCGPoint(const CGPoint &point) {
  return {point.x, point.y};
}

inline facebook::ReactABI31_0_0::Size ABI31_0_0RCTSizeFromCGSize(const CGSize &size) {
  return {size.width, size.height};
}

inline facebook::ReactABI31_0_0::Rect ABI31_0_0RCTRectFromCGRect(const CGRect &rect) {
  return {ABI31_0_0RCTPointFromCGPoint(rect.origin), ABI31_0_0RCTSizeFromCGSize(rect.size)};
}

inline facebook::ReactABI31_0_0::EdgeInsets ABI31_0_0RCTEdgeInsetsFromUIEdgeInsets(const UIEdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}
