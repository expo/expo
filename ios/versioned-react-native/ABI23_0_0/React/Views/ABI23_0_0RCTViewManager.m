/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTViewManager.h"

#import "ABI23_0_0RCTBorderStyle.h"
#import "ABI23_0_0RCTBridge.h"
#import "ABI23_0_0RCTConvert.h"
#import "ABI23_0_0RCTEventDispatcher.h"
#import "ABI23_0_0RCTLog.h"
#import "ABI23_0_0RCTShadowView.h"
#import "ABI23_0_0RCTUIManager.h"
#import "ABI23_0_0RCTUIManagerUtils.h"
#import "ABI23_0_0RCTUtils.h"
#import "ABI23_0_0RCTView.h"
#import "UIView+ReactABI23_0_0.h"
#import "ABI23_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI23_0_0RCTTVView.h"
#endif

@implementation ABI23_0_0RCTConvert(UIAccessibilityTraits)

ABI23_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI23_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI23_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI23_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI23_0_0RCTTVView new];
#else
  return [ABI23_0_0RCTView new];
#endif
}

- (ABI23_0_0RCTShadowView *)shadowView
{
  return [ABI23_0_0RCTShadowView new];
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

- (ABI23_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI23_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI23_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI23_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI23_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI23_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI23_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI23_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI23_0_0AccessibilityElement.onAccessibilityTap, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI23_0_0AccessibilityElement.onMagicTap, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI23_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI23_0_0YGOverflow, ABI23_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI23_0_0RCTConvert ABI23_0_0YGOverflow:json] != ABI23_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI23_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI23_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI23_0_0RCTView)
{
  view.layer.transform = json ? [ABI23_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI23_0_0RCTPointerEvents, ABI23_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI23_0_0RCTConvert ABI23_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI23_0_0RCTConvert ABI23_0_0RCTPointerEvents:json]) {
    case ABI23_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI23_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI23_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI23_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI23_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI23_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI23_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI23_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI23_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI23_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI23_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI23_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI23_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI23_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI23_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI23_0_0RCTBorderStyle, ABI23_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI23_0_0RCTConvert ABI23_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI23_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI23_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI23_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI23_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI23_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI23_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI23_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI23_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI23_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI23_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI23_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI23_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI23_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI23_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI23_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI23_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI23_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI23_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI23_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI23_0_0Display, ABI23_0_0YGDisplay)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI23_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI23_0_0YGValue);

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI23_0_0YGValue)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI23_0_0YGValue)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI23_0_0YGValue)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI23_0_0YGValue)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI23_0_0YGValue)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI23_0_0YGFlexDirection)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI23_0_0YGWrap)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI23_0_0YGJustify)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI23_0_0YGAlign)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI23_0_0YGAlign)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI23_0_0YGAlign)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI23_0_0YGPositionType)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI23_0_0YGOverflow)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI23_0_0YGDisplay)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI23_0_0RCTDirectEventBlock)

ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI23_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI23_0_0YGDirection)

@end
