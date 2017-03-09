/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTViewManager.h"

#import "ABI15_0_0RCTBorderStyle.h"
#import "ABI15_0_0RCTBridge.h"
#import "ABI15_0_0RCTConvert.h"
#import "ABI15_0_0RCTEventDispatcher.h"
#import "ABI15_0_0RCTLog.h"
#import "ABI15_0_0RCTShadowView.h"
#import "ABI15_0_0RCTUIManager.h"
#import "ABI15_0_0RCTUtils.h"
#import "ABI15_0_0RCTView.h"
#import "UIView+ReactABI15_0_0.h"
#import "ABI15_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI15_0_0RCTTVView.h"
#endif

@implementation ABI15_0_0RCTConvert(UIAccessibilityTraits)

ABI15_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI15_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI15_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI15_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI15_0_0RCTTVView new];
#else
  return [ABI15_0_0RCTView new];
#endif
}

- (ABI15_0_0RCTShadowView *)shadowView
{
  return [ABI15_0_0RCTShadowView new];
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

- (ABI15_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI15_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI15_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI15_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI15_0_0YGOverflow, ABI15_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI15_0_0RCTConvert ABI15_0_0YGOverflow:json] != ABI15_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI15_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI15_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, ABI15_0_0RCTView)
{
  view.layer.transform = json ? [ABI15_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI15_0_0RCTView)
{
  view.layer.transform = json ? [ABI15_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI15_0_0RCTPointerEvents, ABI15_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI15_0_0RCTConvert ABI15_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI15_0_0RCTConvert ABI15_0_0RCTPointerEvents:json]) {
    case ABI15_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI15_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI15_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI15_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI15_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI15_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI15_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI15_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI15_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI15_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI15_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI15_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI15_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI15_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI15_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI15_0_0RCTBorderStyle, ABI15_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI15_0_0RCTConvert ABI15_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI15_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI15_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI15_0_0RCTDirectEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI15_0_0RCTDirectEventBlock)

#define ABI15_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI15_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI15_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI15_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI15_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI15_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI15_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI15_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI15_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI15_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI15_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI15_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI15_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI15_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI15_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI15_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI15_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI15_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI15_0_0YGValue);

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI15_0_0YGValue)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI15_0_0YGValue)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI15_0_0YGValue)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI15_0_0YGValue)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI15_0_0YGValue)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI15_0_0YGFlexDirection)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI15_0_0YGWrap)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI15_0_0YGJustify)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI15_0_0YGAlign)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI15_0_0YGAlign)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI15_0_0YGPositionType)
ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI15_0_0YGOverflow)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI15_0_0RCTDirectEventBlock)

ABI15_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)

@end
