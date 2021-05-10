/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTViewManager.h"

#import "ABI39_0_0RCTBorderStyle.h"
#import "ABI39_0_0RCTBridge.h"
#import "ABI39_0_0RCTConvert+Transform.h"
#import "ABI39_0_0RCTConvert.h"
#import "ABI39_0_0RCTEventDispatcher.h"
#import "ABI39_0_0RCTLog.h"
#import "ABI39_0_0RCTShadowView.h"
#import "ABI39_0_0RCTUIManager.h"
#import "ABI39_0_0RCTUIManagerUtils.h"
#import "ABI39_0_0RCTUtils.h"
#import "ABI39_0_0RCTView.h"
#import "ABI39_0_0UIView+React.h"

#if TARGET_OS_TV
#import "ABI39_0_0RCTTVView.h"
#endif

@implementation ABI39_0_0RCTConvert (UIAccessibilityTraits)

ABI39_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"link" : @(UIAccessibilityTraitLink),
      @"header" : @(UIAccessibilityTraitHeader),
      @"search" : @(UIAccessibilityTraitSearchField),
      @"image" : @(UIAccessibilityTraitImage),
      @"imagebutton" : @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
      @"selected" : @(UIAccessibilityTraitSelected),
      @"plays" : @(UIAccessibilityTraitPlaysSound),
      @"key" : @(UIAccessibilityTraitKeyboardKey),
      @"keyboardkey" : @(UIAccessibilityTraitKeyboardKey),
      @"text" : @(UIAccessibilityTraitStaticText),
      @"summary" : @(UIAccessibilityTraitSummaryElement),
      @"disabled" : @(UIAccessibilityTraitNotEnabled),
      @"frequentUpdates" : @(UIAccessibilityTraitUpdatesFrequently),
      @"startsMedia" : @(UIAccessibilityTraitStartsMediaSession),
      @"adjustable" : @(UIAccessibilityTraitAdjustable),
      @"allowsDirectInteraction" : @(UIAccessibilityTraitAllowsDirectInteraction),
      @"pageTurn" : @(UIAccessibilityTraitCausesPageTurn),
      @"alert" : @(UIAccessibilityTraitNone),
      @"checkbox" : @(UIAccessibilityTraitNone),
      @"combobox" : @(UIAccessibilityTraitNone),
      @"menu" : @(UIAccessibilityTraitNone),
      @"menubar" : @(UIAccessibilityTraitNone),
      @"menuitem" : @(UIAccessibilityTraitNone),
      @"progressbar" : @(UIAccessibilityTraitNone),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI39_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI39_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI39_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI39_0_0RCTTVView new];
#else
  return [ABI39_0_0RCTView new];
#endif
}

- (ABI39_0_0RCTShadowView *)shadowView
{
  return [ABI39_0_0RCTShadowView new];
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

#pragma mark - View properties

#if TARGET_OS_TV
// TODO: Delete props for Apple TV.
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Accessibility related properties
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI39_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI39_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI39_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI39_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI39_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI39_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI39_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI39_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI39_0_0ReactAccessibilityElement.onAccessibilityAction, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI39_0_0ReactAccessibilityElement.onAccessibilityTap, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI39_0_0ReactAccessibilityElement.onMagicTap, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI39_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI39_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI39_0_0YGOverflow, ABI39_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI39_0_0RCTConvert ABI39_0_0YGOverflow:json] != ABI39_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI39_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI39_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI39_0_0RCTView)
{
  view.layer.transform = json ? [ABI39_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI39_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI39_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI39_0_0RCTConvert NSString:json] : @"";
    view.ABI39_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI39_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI39_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI39_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI39_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI39_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI39_0_0RCTView)
{
  view.nativeID = json ? [ABI39_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI39_0_0RCTPointerEvents, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI39_0_0RCTConvert ABI39_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI39_0_0RCTConvert ABI39_0_0RCTPointerEvents:json]) {
    case ABI39_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI39_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI39_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI39_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI39_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI39_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI39_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI39_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI39_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI39_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI39_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI39_0_0RCTBorderStyle, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI39_0_0RCTConvert ABI39_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI39_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI39_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI39_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI39_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI39_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI39_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI39_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI39_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI39_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI39_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI39_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI39_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI39_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI39_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI39_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI39_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI39_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI39_0_0ReactDisplay, ABI39_0_0YGDisplay)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI39_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI39_0_0YGValue)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI39_0_0YGValue)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI39_0_0YGValue)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI39_0_0YGValue)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI39_0_0YGValue)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI39_0_0YGValue)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI39_0_0YGFlexDirection)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI39_0_0YGWrap)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI39_0_0YGJustify)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI39_0_0YGAlign)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI39_0_0YGAlign)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI39_0_0YGAlign)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI39_0_0YGPositionType)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI39_0_0YGOverflow)
ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI39_0_0YGDisplay)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI39_0_0RCTDirectEventBlock)

ABI39_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI39_0_0YGDirection)

@end
