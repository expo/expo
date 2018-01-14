/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTViewManager.h"

#import "ABI25_0_0RCTBorderStyle.h"
#import "ABI25_0_0RCTBridge.h"
#import "ABI25_0_0RCTConvert.h"
#import "ABI25_0_0RCTEventDispatcher.h"
#import "ABI25_0_0RCTLog.h"
#import "ABI25_0_0RCTShadowView.h"
#import "ABI25_0_0RCTUIManager.h"
#import "ABI25_0_0RCTUIManagerUtils.h"
#import "ABI25_0_0RCTUtils.h"
#import "ABI25_0_0RCTView.h"
#import "UIView+ReactABI25_0_0.h"
#import "ABI25_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI25_0_0RCTTVView.h"
#endif

@implementation ABI25_0_0RCTConvert(UIAccessibilityTraits)

ABI25_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI25_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI25_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI25_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI25_0_0RCTTVView new];
#else
  return [ABI25_0_0RCTView new];
#endif
}

- (ABI25_0_0RCTShadowView *)shadowView
{
  return [ABI25_0_0RCTShadowView new];
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

- (ABI25_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI25_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI25_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI25_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI25_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI25_0_0AccessibilityElement.accessibilityActions, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI25_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI25_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI25_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI25_0_0AccessibilityElement.onAccessibilityAction, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI25_0_0AccessibilityElement.onAccessibilityTap, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI25_0_0AccessibilityElement.onMagicTap, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI25_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI25_0_0YGOverflow, ABI25_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI25_0_0RCTConvert ABI25_0_0YGOverflow:json] != ABI25_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI25_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI25_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI25_0_0RCTView)
{
  view.layer.transform = json ? [ABI25_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI25_0_0RCTPointerEvents, ABI25_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI25_0_0RCTConvert ABI25_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI25_0_0RCTConvert ABI25_0_0RCTPointerEvents:json]) {
    case ABI25_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI25_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI25_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI25_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI25_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI25_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI25_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI25_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI25_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI25_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI25_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI25_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI25_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI25_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI25_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI25_0_0RCTBorderStyle, ABI25_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI25_0_0RCTConvert ABI25_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI25_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI25_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI25_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI25_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI25_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI25_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI25_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI25_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI25_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI25_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI25_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI25_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI25_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI25_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI25_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI25_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI25_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI25_0_0Display, ABI25_0_0YGDisplay)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI25_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI25_0_0YGValue)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI25_0_0YGValue)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI25_0_0YGValue)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI25_0_0YGValue)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI25_0_0YGValue)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI25_0_0YGValue)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI25_0_0YGFlexDirection)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI25_0_0YGWrap)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI25_0_0YGJustify)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI25_0_0YGAlign)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI25_0_0YGAlign)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI25_0_0YGAlign)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI25_0_0YGPositionType)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI25_0_0YGOverflow)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI25_0_0YGDisplay)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI25_0_0RCTDirectEventBlock)

ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI25_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI25_0_0YGDirection)

@end
