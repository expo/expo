/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTViewManager.h"

#import "ABI22_0_0RCTBorderStyle.h"
#import "ABI22_0_0RCTBridge.h"
#import "ABI22_0_0RCTConvert.h"
#import "ABI22_0_0RCTEventDispatcher.h"
#import "ABI22_0_0RCTLog.h"
#import "ABI22_0_0RCTShadowView.h"
#import "ABI22_0_0RCTUIManager.h"
#import "ABI22_0_0RCTUtils.h"
#import "ABI22_0_0RCTView.h"
#import "UIView+ReactABI22_0_0.h"
#import "ABI22_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI22_0_0RCTTVView.h"
#endif

@implementation ABI22_0_0RCTConvert(UIAccessibilityTraits)

ABI22_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI22_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI22_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI22_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI22_0_0RCTTVView new];
#else
  return [ABI22_0_0RCTView new];
#endif
}

- (ABI22_0_0RCTShadowView *)shadowView
{
  return [ABI22_0_0RCTShadowView new];
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

- (ABI22_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI22_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI22_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI22_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI22_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI22_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI22_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI22_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI22_0_0AccessibilityElement.onAccessibilityTap, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI22_0_0AccessibilityElement.onMagicTap, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI22_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI22_0_0YGOverflow, ABI22_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI22_0_0RCTConvert ABI22_0_0YGOverflow:json] != ABI22_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI22_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI22_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI22_0_0RCTView)
{
  view.layer.transform = json ? [ABI22_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI22_0_0RCTPointerEvents, ABI22_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI22_0_0RCTConvert ABI22_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI22_0_0RCTConvert ABI22_0_0RCTPointerEvents:json]) {
    case ABI22_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI22_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI22_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI22_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI22_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI22_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI22_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI22_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI22_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI22_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI22_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI22_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI22_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI22_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI22_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI22_0_0RCTBorderStyle, ABI22_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI22_0_0RCTConvert ABI22_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI22_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI22_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI22_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI22_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI22_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI22_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI22_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI22_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI22_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI22_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI22_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI22_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI22_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI22_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI22_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI22_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI22_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI22_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI22_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI22_0_0Display, ABI22_0_0YGDisplay)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI22_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI22_0_0YGValue);

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI22_0_0YGValue)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI22_0_0YGValue)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI22_0_0YGValue)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI22_0_0YGValue)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI22_0_0YGValue)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI22_0_0YGFlexDirection)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI22_0_0YGWrap)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI22_0_0YGJustify)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI22_0_0YGAlign)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI22_0_0YGAlign)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI22_0_0YGAlign)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI22_0_0YGPositionType)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI22_0_0YGOverflow)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI22_0_0YGDisplay)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI22_0_0RCTDirectEventBlock)

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI22_0_0YGDirection)

@end
