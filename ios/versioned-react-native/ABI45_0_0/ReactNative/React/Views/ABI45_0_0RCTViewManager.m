/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTViewManager.h"

#import "ABI45_0_0RCTAssert.h"
#import "ABI45_0_0RCTBorderStyle.h"
#import "ABI45_0_0RCTBridge.h"
#import "ABI45_0_0RCTConvert+Transform.h"
#import "ABI45_0_0RCTConvert.h"
#import "ABI45_0_0RCTLog.h"
#import "ABI45_0_0RCTShadowView.h"
#import "ABI45_0_0RCTUIManager.h"
#import "ABI45_0_0RCTUIManagerUtils.h"
#import "ABI45_0_0RCTUtils.h"
#import "ABI45_0_0RCTView.h"
#import "ABI45_0_0UIView+React.h"

@implementation ABI45_0_0RCTConvert (UIAccessibilityTraits)

ABI45_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"togglebutton" : @(UIAccessibilityTraitButton),
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
      @"progressbar" : @(UIAccessibilityTraitUpdatesFrequently),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tabbar" : @(UIAccessibilityTraitTabBar),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
      @"list" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI45_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI45_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI45_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
  ABI45_0_0RCTWarnNotAllowedForNewArchitecture(self, @"ABI45_0_0RCTViewManager must not be initialized for the new architecture");
  _bridge = bridge;
}

- (UIView *)view
{
  return [ABI45_0_0RCTView new];
}

- (ABI45_0_0RCTShadowView *)shadowView
{
  return [ABI45_0_0RCTShadowView new];
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
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI45_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI45_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI45_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI45_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI45_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI45_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI45_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI45_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI45_0_0ReactAccessibilityElement.onAccessibilityAction, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI45_0_0ReactAccessibilityElement.onAccessibilityTap, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI45_0_0ReactAccessibilityElement.onMagicTap, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI45_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI45_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI45_0_0YGOverflow, ABI45_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI45_0_0RCTConvert ABI45_0_0YGOverflow:json] != ABI45_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI45_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI45_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI45_0_0RCTView)
{
  view.layer.transform = json ? [ABI45_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing =
      view.layer.transform.m12 != 0.0f || view.layer.transform.m21 != 0.0f || view.layer.transform.m34 != 0.0f;
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI45_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | UIAccessibilityTraitTabBar |
      UIAccessibilityTraitUpdatesFrequently | SwitchAccessibilityTrait;
  view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI45_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI45_0_0RCTConvert NSString:json] : @"";
    view.ABI45_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI45_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI45_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [NSMutableDictionary<NSString *, id> new];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI45_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI45_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI45_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI45_0_0RCTView)
{
  view.nativeID = json ? [ABI45_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI45_0_0RCTPointerEvents, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI45_0_0RCTConvert ABI45_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI45_0_0RCTConvert ABI45_0_0RCTPointerEvents:json]) {
    case ABI45_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI45_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI45_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI45_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI45_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI45_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI45_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI45_0_0RCTConvert UIColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI45_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI45_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI45_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI45_0_0RCTBorderStyle, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI45_0_0RCTConvert ABI45_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI45_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI45_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(collapsable, BOOL, ABI45_0_0RCTView)
{
  // Property is only to be used in the new renderer.
  // It is necessary to add it here, otherwise it gets
  // filtered by view configs.
}

#define ABI45_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI45_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI45_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI45_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI45_0_0RCTConvert UIColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI45_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI45_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI45_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI45_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI45_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI45_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI45_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI45_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI45_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI45_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI45_0_0ReactDisplay, ABI45_0_0YGDisplay)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI45_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI45_0_0YGValue)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI45_0_0YGValue)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI45_0_0YGValue)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI45_0_0YGValue)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI45_0_0YGValue)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI45_0_0YGValue)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI45_0_0YGFlexDirection)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI45_0_0YGWrap)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI45_0_0YGJustify)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI45_0_0YGAlign)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI45_0_0YGAlign)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI45_0_0YGAlign)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI45_0_0YGPositionType)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI45_0_0YGOverflow)
ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI45_0_0YGDisplay)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI45_0_0RCTDirectEventBlock)

ABI45_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI45_0_0YGDirection)

@end
