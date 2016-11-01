/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTViewManager.h"

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTBorderStyle.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTEventDispatcher.h"
#import "ABI11_0_0RCTLog.h"
#import "ABI11_0_0RCTShadowView.h"
#import "ABI11_0_0RCTUIManager.h"
#import "ABI11_0_0RCTUtils.h"
#import "ABI11_0_0RCTView.h"
#import "UIView+ReactABI11_0_0.h"

@implementation ABI11_0_0RCTConvert(UIAccessibilityTraits)

ABI11_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI11_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI11_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI11_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [ABI11_0_0RCTView new];
}

- (ABI11_0_0RCTShadowView *)shadowView
{
  return [ABI11_0_0RCTShadowView new];
}

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[

    // Generic events
    @"press",
    @"change",
    @"focus",
    @"blur",
    @"submitEditing",
    @"endEditing",
    @"keyPress",

    // Touch events
    @"touchStart",
    @"touchMove",
    @"touchCancel",
    @"touchEnd",
  ];
}

- (NSArray<NSString *> *)customDirectEventTypes
{
  return @[];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"forceTouchAvailable": @(ABI11_0_0RCTForceTouchAvailable())};
}

- (ABI11_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI11_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI11_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI11_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI11_0_0CSSOverflow, ABI11_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI11_0_0RCTConvert ABI11_0_0CSSOverflow:json] != ABI11_0_0CSSOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI11_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI11_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, ABI11_0_0RCTView)
{
  view.layer.transform = json ? [ABI11_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI11_0_0RCTView)
{
  view.layer.transform = json ? [ABI11_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI11_0_0RCTPointerEvents, ABI11_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI11_0_0RCTConvert ABI11_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI11_0_0RCTConvert ABI11_0_0RCTPointerEvents:json]) {
    case ABI11_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in ABI11_0_0CSS (which cannot and will not be
      // supported in `ReactABI11_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI11_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI11_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI11_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI11_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI11_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI11_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI11_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI11_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI11_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI11_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, CGFloat, ABI11_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI11_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI11_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI11_0_0RCTBorderStyle, ABI11_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI11_0_0RCTConvert ABI11_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI11_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI11_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI11_0_0RCTDirectEventBlock)

#define ABI11_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, CGFloat, ABI11_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI11_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI11_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI11_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI11_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI11_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI11_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI11_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI11_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI11_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI11_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI11_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI11_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI11_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI11_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI11_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI11_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(top, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(right, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(left, CGFloat);

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(width, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(height, CGFloat)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, CGFloat)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, CGFloat)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, CGFloat)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, CGFloat)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI11_0_0CSSFlexDirection)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI11_0_0CSSWrapType)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI11_0_0CSSJustify)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI11_0_0CSSAlign)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI11_0_0CSSAlign)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI11_0_0CSSPositionType)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI11_0_0CSSOverflow)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI11_0_0RCTDirectEventBlock)

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)

@end
