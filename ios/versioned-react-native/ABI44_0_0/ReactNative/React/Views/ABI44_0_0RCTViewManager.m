/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTViewManager.h"

#import "ABI44_0_0RCTBorderStyle.h"
#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTConvert+Transform.h"
#import "ABI44_0_0RCTConvert.h"
#import "ABI44_0_0RCTLog.h"
#import "ABI44_0_0RCTShadowView.h"
#import "ABI44_0_0RCTUIManager.h"
#import "ABI44_0_0RCTUIManagerUtils.h"
#import "ABI44_0_0RCTUtils.h"
#import "ABI44_0_0RCTView.h"
#import "ABI44_0_0UIView+React.h"

@implementation ABI44_0_0RCTConvert (UIAccessibilityTraits)

ABI44_0_0RCT_MULTI_ENUM_CONVERTER(
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

@implementation ABI44_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI44_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI44_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [ABI44_0_0RCTView new];
}

- (ABI44_0_0RCTShadowView *)shadowView
{
  return [ABI44_0_0RCTShadowView new];
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

// Accessibility related properties
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI44_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI44_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI44_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI44_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI44_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI44_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI44_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI44_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI44_0_0ReactAccessibilityElement.onAccessibilityAction, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI44_0_0ReactAccessibilityElement.onAccessibilityTap, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI44_0_0ReactAccessibilityElement.onMagicTap, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI44_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI44_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI44_0_0YGOverflow, ABI44_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI44_0_0RCTConvert ABI44_0_0YGOverflow:json] != ABI44_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI44_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI44_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI44_0_0RCTView)
{
  view.layer.transform = json ? [ABI44_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI44_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI44_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI44_0_0RCTConvert NSString:json] : @"";
    view.ABI44_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI44_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI44_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI44_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI44_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI44_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI44_0_0RCTView)
{
  view.nativeID = json ? [ABI44_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI44_0_0RCTPointerEvents, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI44_0_0RCTConvert ABI44_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI44_0_0RCTConvert ABI44_0_0RCTPointerEvents:json]) {
    case ABI44_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI44_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI44_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI44_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI44_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI44_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI44_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI44_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI44_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI44_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI44_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI44_0_0RCTBorderStyle, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI44_0_0RCTConvert ABI44_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI44_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI44_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI44_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI44_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI44_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI44_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI44_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI44_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI44_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI44_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI44_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI44_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI44_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI44_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI44_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI44_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI44_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI44_0_0ReactDisplay, ABI44_0_0YGDisplay)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI44_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI44_0_0YGValue)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI44_0_0YGValue)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI44_0_0YGValue)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI44_0_0YGValue)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI44_0_0YGValue)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI44_0_0YGValue)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI44_0_0YGFlexDirection)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI44_0_0YGWrap)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI44_0_0YGJustify)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI44_0_0YGAlign)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI44_0_0YGAlign)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI44_0_0YGAlign)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI44_0_0YGPositionType)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI44_0_0YGOverflow)
ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI44_0_0YGDisplay)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI44_0_0RCTDirectEventBlock)

ABI44_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI44_0_0YGDirection)

@end
