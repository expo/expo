/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTViewManager.h"

#import "ABI24_0_0RCTBorderStyle.h"
#import "ABI24_0_0RCTBridge.h"
#import "ABI24_0_0RCTConvert.h"
#import "ABI24_0_0RCTEventDispatcher.h"
#import "ABI24_0_0RCTLog.h"
#import "ABI24_0_0RCTShadowView.h"
#import "ABI24_0_0RCTUIManager.h"
#import "ABI24_0_0RCTUIManagerUtils.h"
#import "ABI24_0_0RCTUtils.h"
#import "ABI24_0_0RCTView.h"
#import "UIView+ReactABI24_0_0.h"
#import "ABI24_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI24_0_0RCTTVView.h"
#endif

@implementation ABI24_0_0RCTConvert(UIAccessibilityTraits)

ABI24_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI24_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI24_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI24_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI24_0_0RCTTVView new];
#else
  return [ABI24_0_0RCTView new];
#endif
}

- (ABI24_0_0RCTShadowView *)shadowView
{
  return [ABI24_0_0RCTShadowView new];
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

- (ABI24_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI24_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI24_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI24_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI24_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI24_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI24_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI24_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI24_0_0AccessibilityElement.onAccessibilityTap, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI24_0_0AccessibilityElement.onMagicTap, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI24_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI24_0_0YGOverflow, ABI24_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI24_0_0RCTConvert ABI24_0_0YGOverflow:json] != ABI24_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI24_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI24_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI24_0_0RCTView)
{
  view.layer.transform = json ? [ABI24_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI24_0_0RCTPointerEvents, ABI24_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI24_0_0RCTConvert ABI24_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI24_0_0RCTConvert ABI24_0_0RCTPointerEvents:json]) {
    case ABI24_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI24_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI24_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI24_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI24_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI24_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI24_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI24_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI24_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI24_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI24_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI24_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI24_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI24_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI24_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI24_0_0RCTBorderStyle, ABI24_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI24_0_0RCTConvert ABI24_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI24_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI24_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI24_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI24_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI24_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI24_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI24_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI24_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI24_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI24_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI24_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI24_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI24_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI24_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI24_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI24_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI24_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI24_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI24_0_0Display, ABI24_0_0YGDisplay)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI24_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI24_0_0YGValue)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI24_0_0YGValue)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI24_0_0YGValue)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI24_0_0YGValue)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI24_0_0YGValue)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI24_0_0YGValue)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI24_0_0YGFlexDirection)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI24_0_0YGWrap)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI24_0_0YGJustify)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI24_0_0YGAlign)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI24_0_0YGAlign)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI24_0_0YGAlign)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI24_0_0YGPositionType)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI24_0_0YGOverflow)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI24_0_0YGDisplay)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI24_0_0RCTDirectEventBlock)

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI24_0_0YGDirection)

@end
