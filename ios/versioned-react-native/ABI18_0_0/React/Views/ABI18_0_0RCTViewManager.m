/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTViewManager.h"

#import "ABI18_0_0RCTBorderStyle.h"
#import "ABI18_0_0RCTBridge.h"
#import "ABI18_0_0RCTConvert.h"
#import "ABI18_0_0RCTEventDispatcher.h"
#import "ABI18_0_0RCTLog.h"
#import "ABI18_0_0RCTShadowView.h"
#import "ABI18_0_0RCTUIManager.h"
#import "ABI18_0_0RCTUtils.h"
#import "ABI18_0_0RCTView.h"
#import "UIView+ReactABI18_0_0.h"
#import "ABI18_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI18_0_0RCTTVView.h"
#endif

@implementation ABI18_0_0RCTConvert(UIAccessibilityTraits)

ABI18_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI18_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI18_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI18_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI18_0_0RCTTVView new];
#else
  return [ABI18_0_0RCTView new];
#endif
}

- (ABI18_0_0RCTShadowView *)shadowView
{
  return [ABI18_0_0RCTShadowView new];
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

- (ABI18_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI18_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI18_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI18_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI18_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityViewIsModal, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI18_0_0YGOverflow, ABI18_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI18_0_0RCTConvert ABI18_0_0YGOverflow:json] != ABI18_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI18_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI18_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI18_0_0RCTView)
{
  view.layer.transform = json ? [ABI18_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI18_0_0RCTPointerEvents, ABI18_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI18_0_0RCTConvert ABI18_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI18_0_0RCTConvert ABI18_0_0RCTPointerEvents:json]) {
    case ABI18_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI18_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI18_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI18_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI18_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI18_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI18_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI18_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI18_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI18_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI18_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI18_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI18_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI18_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI18_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI18_0_0RCTBorderStyle, ABI18_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI18_0_0RCTConvert ABI18_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI18_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI18_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI18_0_0RCTDirectEventBlock)

#define ABI18_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI18_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI18_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI18_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI18_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI18_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI18_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI18_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI18_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI18_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI18_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI18_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI18_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI18_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI18_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI18_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI18_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI18_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI18_0_0YGValue);

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI18_0_0YGValue)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI18_0_0YGValue)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI18_0_0YGValue)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI18_0_0YGValue)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI18_0_0YGValue)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI18_0_0YGFlexDirection)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI18_0_0YGWrap)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI18_0_0YGJustify)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI18_0_0YGAlign)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI18_0_0YGAlign)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI18_0_0YGAlign)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI18_0_0YGPositionType)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI18_0_0YGOverflow)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI18_0_0YGDisplay)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI18_0_0RCTDirectEventBlock)

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI18_0_0YGDirection)

@end
