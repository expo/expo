/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTViewManager.h"

#import "ABI17_0_0RCTBorderStyle.h"
#import "ABI17_0_0RCTBridge.h"
#import "ABI17_0_0RCTConvert.h"
#import "ABI17_0_0RCTEventDispatcher.h"
#import "ABI17_0_0RCTLog.h"
#import "ABI17_0_0RCTShadowView.h"
#import "ABI17_0_0RCTUIManager.h"
#import "ABI17_0_0RCTUtils.h"
#import "ABI17_0_0RCTView.h"
#import "UIView+ReactABI17_0_0.h"
#import "ABI17_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI17_0_0RCTTVView.h"
#endif

@implementation ABI17_0_0RCTConvert(UIAccessibilityTraits)

ABI17_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI17_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI17_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI17_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI17_0_0RCTTVView new];
#else
  return [ABI17_0_0RCTView new];
#endif
}

- (ABI17_0_0RCTShadowView *)shadowView
{
  return [ABI17_0_0RCTShadowView new];
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

- (ABI17_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI17_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI17_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI17_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI17_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityViewIsModal, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI17_0_0YGOverflow, ABI17_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI17_0_0RCTConvert ABI17_0_0YGOverflow:json] != ABI17_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI17_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI17_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI17_0_0RCTView)
{
  view.layer.transform = json ? [ABI17_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI17_0_0RCTPointerEvents, ABI17_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI17_0_0RCTConvert ABI17_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI17_0_0RCTConvert ABI17_0_0RCTPointerEvents:json]) {
    case ABI17_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI17_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI17_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI17_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI17_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI17_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI17_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI17_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI17_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI17_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI17_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI17_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI17_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI17_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI17_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI17_0_0RCTBorderStyle, ABI17_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI17_0_0RCTConvert ABI17_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI17_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI17_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI17_0_0RCTDirectEventBlock)

#define ABI17_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI17_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI17_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI17_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI17_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI17_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI17_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI17_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI17_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI17_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI17_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI17_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI17_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI17_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI17_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI17_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(zIndex, NSInteger, ABI17_0_0RCTView)
{
  if (json) {
    NSInteger index = [ABI17_0_0RCTConvert NSInteger:json];
    view.layer.zPosition = index;
  } else {
    view.layer.zPosition = 0;
  }
}

#pragma mark - ShadowView properties

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI17_0_0YGValue);

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI17_0_0YGValue)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI17_0_0YGValue)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI17_0_0YGValue)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI17_0_0YGValue)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI17_0_0YGValue)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI17_0_0YGFlexDirection)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI17_0_0YGWrap)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI17_0_0YGJustify)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI17_0_0YGAlign)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI17_0_0YGAlign)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI17_0_0YGAlign)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI17_0_0YGPositionType)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI17_0_0YGOverflow)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI17_0_0YGDisplay)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI17_0_0RCTDirectEventBlock)

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI17_0_0YGDirection)

@end
