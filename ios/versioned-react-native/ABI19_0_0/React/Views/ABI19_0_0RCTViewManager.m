/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTViewManager.h"

#import "ABI19_0_0RCTBorderStyle.h"
#import "ABI19_0_0RCTBridge.h"
#import "ABI19_0_0RCTConvert.h"
#import "ABI19_0_0RCTEventDispatcher.h"
#import "ABI19_0_0RCTLog.h"
#import "ABI19_0_0RCTShadowView.h"
#import "ABI19_0_0RCTUIManager.h"
#import "ABI19_0_0RCTUtils.h"
#import "ABI19_0_0RCTView.h"
#import "UIView+ReactABI19_0_0.h"
#import "ABI19_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI19_0_0RCTTVView.h"
#endif

@implementation ABI19_0_0RCTConvert(UIAccessibilityTraits)

ABI19_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI19_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI19_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI19_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI19_0_0RCTTVView new];
#else
  return [ABI19_0_0RCTView new];
#endif
}

- (ABI19_0_0RCTShadowView *)shadowView
{
  return [ABI19_0_0RCTShadowView new];
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

- (ABI19_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI19_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI19_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI19_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Acessibility related properties
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI19_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI19_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI19_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI19_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI19_0_0AccessibilityElement.onAccessibilityTap, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI19_0_0AccessibilityElement.onMagicTap, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI19_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI19_0_0YGOverflow, ABI19_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI19_0_0RCTConvert ABI19_0_0YGOverflow:json] != ABI19_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI19_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI19_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI19_0_0RCTView)
{
  view.layer.transform = json ? [ABI19_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI19_0_0RCTPointerEvents, ABI19_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI19_0_0RCTConvert ABI19_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI19_0_0RCTConvert ABI19_0_0RCTPointerEvents:json]) {
    case ABI19_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI19_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI19_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI19_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI19_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI19_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI19_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI19_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI19_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI19_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI19_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI19_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI19_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI19_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI19_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI19_0_0RCTBorderStyle, ABI19_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI19_0_0RCTConvert ABI19_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI19_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI19_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI19_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI19_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI19_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI19_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI19_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI19_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI19_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI19_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI19_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI19_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI19_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI19_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI19_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI19_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI19_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI19_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI19_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI19_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI19_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI19_0_0YGValue);

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI19_0_0YGValue)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI19_0_0YGValue)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI19_0_0YGValue)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI19_0_0YGValue)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI19_0_0YGValue)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI19_0_0YGFlexDirection)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI19_0_0YGWrap)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI19_0_0YGJustify)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI19_0_0YGAlign)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI19_0_0YGAlign)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI19_0_0YGAlign)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI19_0_0YGPositionType)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI19_0_0YGOverflow)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI19_0_0YGDisplay)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI19_0_0RCTDirectEventBlock)

ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI19_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI19_0_0YGDirection)

@end
