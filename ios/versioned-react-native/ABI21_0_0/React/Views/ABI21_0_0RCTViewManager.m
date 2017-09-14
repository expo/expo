/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0RCTViewManager.h"

#import "ABI21_0_0RCTBorderStyle.h"
#import "ABI21_0_0RCTBridge.h"
#import "ABI21_0_0RCTConvert.h"
#import "ABI21_0_0RCTEventDispatcher.h"
#import "ABI21_0_0RCTLog.h"
#import "ABI21_0_0RCTShadowView.h"
#import "ABI21_0_0RCTUIManager.h"
#import "ABI21_0_0RCTUtils.h"
#import "ABI21_0_0RCTView.h"
#import "UIView+ReactABI21_0_0.h"
#import "ABI21_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI21_0_0RCTTVView.h"
#endif

@implementation ABI21_0_0RCTConvert(UIAccessibilityTraits)

ABI21_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI21_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI21_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI21_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI21_0_0RCTTVView new];
#else
  return [ABI21_0_0RCTView new];
#endif
}

- (ABI21_0_0RCTShadowView *)shadowView
{
  return [ABI21_0_0RCTShadowView new];
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

- (ABI21_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI21_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI21_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI21_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI21_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI21_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI21_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI21_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI21_0_0AccessibilityElement.onAccessibilityTap, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI21_0_0AccessibilityElement.onMagicTap, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI21_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI21_0_0YGOverflow, ABI21_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI21_0_0RCTConvert ABI21_0_0YGOverflow:json] != ABI21_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI21_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI21_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI21_0_0RCTView)
{
  view.layer.transform = json ? [ABI21_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI21_0_0RCTPointerEvents, ABI21_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI21_0_0RCTConvert ABI21_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI21_0_0RCTConvert ABI21_0_0RCTPointerEvents:json]) {
    case ABI21_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI21_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI21_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI21_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI21_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI21_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI21_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI21_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI21_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI21_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI21_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI21_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI21_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI21_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI21_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI21_0_0RCTBorderStyle, ABI21_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI21_0_0RCTConvert ABI21_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI21_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI21_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI21_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI21_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI21_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI21_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI21_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI21_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI21_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI21_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI21_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI21_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI21_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI21_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI21_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI21_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI21_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI21_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI21_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI21_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI21_0_0Display, ABI21_0_0YGDisplay)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI21_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI21_0_0YGValue);

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI21_0_0YGValue)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI21_0_0YGValue)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI21_0_0YGValue)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI21_0_0YGValue)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI21_0_0YGValue)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI21_0_0YGFlexDirection)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI21_0_0YGWrap)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI21_0_0YGJustify)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI21_0_0YGAlign)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI21_0_0YGAlign)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI21_0_0YGAlign)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI21_0_0YGPositionType)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI21_0_0YGOverflow)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI21_0_0YGDisplay)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI21_0_0RCTDirectEventBlock)

ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI21_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI21_0_0YGDirection)

@end
