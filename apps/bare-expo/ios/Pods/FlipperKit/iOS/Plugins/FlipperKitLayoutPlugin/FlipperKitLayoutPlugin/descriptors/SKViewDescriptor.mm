/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKViewDescriptor.h"

#import <FlipperKitHighlightOverlay/SKHighlightOverlay.h>
#import <YogaKit/UIView+Yoga.h>
#import "SKDescriptorMapper.h"
#import "SKHiddenWindow.h"
#import "SKNamed.h"
#import "SKObject.h"
#import "SKYogaKitHelper.h"
#import "UIColor+SKSonarValueCoder.h"

@implementation SKViewDescriptor

static NSDictionary* YGDirectionEnumMap = nil;
static NSDictionary* YGFlexDirectionEnumMap = nil;
static NSDictionary* YGJustifyEnumMap = nil;
static NSDictionary* YGAlignEnumMap = nil;
static NSDictionary* YGPositionTypeEnumMap = nil;
static NSDictionary* YGWrapEnumMap = nil;
static NSDictionary* YGOverflowEnumMap = nil;
static NSDictionary* YGDisplayEnumMap = nil;
static NSDictionary* YGUnitEnumMap = nil;

- (instancetype)initWithDescriptorMapper:(SKDescriptorMapper*)mapper {
  if (self = [super initWithDescriptorMapper:mapper]) {
    initEnumDictionaries();
  }

  return self;
}

- (NSString*)identifierForNode:(UIView*)node {
  return [NSString stringWithFormat:@"%p", node];
}

- (NSUInteger)childCountForNode:(UIView*)node {
  return [[self validChildrenForNode:node] count];
}

- (id)childForNode:(UIView*)node atIndex:(NSUInteger)index {
  return [[self validChildrenForNode:node] objectAtIndex:index];
}

- (NSArray*)validChildrenForNode:(UIView*)node {
  NSMutableArray* validChildren = [NSMutableArray new];

  // Use UIViewControllers for children which responds to a different
  // viewController than their parent
  for (UIView* child in node.subviews) {
    BOOL responderIsUIViewController =
        [child.nextResponder isKindOfClass:[UIViewController class]];

    if (!child.isHidden) {
      if (responderIsUIViewController &&
          child.nextResponder != node.nextResponder) {
        [validChildren addObject:child.nextResponder];
      } else {
        [validChildren addObject:child];
      }
    }
  }

  return validChildren;
}

- (NSArray<SKNamed<NSDictionary*>*>*)dataForNode:(UIView*)node {
  return [NSArray
      arrayWithObjects:
          [SKNamed
              newWithName:@"UIView"
                withValue:@{
                  @"frame" : SKMutableObject(node.frame),
                  @"bounds" : SKObject(node.bounds),
                  @"center" : SKObject(node.center),
                  @"layoutMargins" : SKObject(node.layoutMargins),
                  @"clipsToBounds" : @(node.clipsToBounds),
                  @"alpha" : SKMutableObject(@(node.alpha)),
                  @"tag" : @(node.tag),
                  @"backgroundColor" : SKMutableObject(node.backgroundColor)
                }],
          [SKNamed
              newWithName:@"CALayer"
                withValue:@{
                  @"shadowColor" : SKMutableObject(
                      [UIColor colorWithCGColor:node.layer.shadowColor]),
                  @"shadowOpacity" :
                      SKMutableObject(@(node.layer.shadowOpacity)),
                  @"shadowRadius" : SKMutableObject(@(node.layer.shadowRadius)),
                  @"shadowOffset" : SKMutableObject(node.layer.shadowOffset),
                  @"backgroundColor" : SKMutableObject(
                      [UIColor colorWithCGColor:node.layer.backgroundColor]),
                  @"borderColor" : SKMutableObject(
                      [UIColor colorWithCGColor:node.layer.borderColor]),
                  @"borderWidth" : SKMutableObject(@(node.layer.borderWidth)),
                  @"cornerRadius" : SKMutableObject(@(node.layer.cornerRadius)),
                  @"masksToBounds" :
                      SKMutableObject(@(node.layer.masksToBounds)),
                }],
          [SKNamed newWithName:@"Accessibility"
                     withValue:@{
                       @"isAccessibilityElement" :
                           SKMutableObject(@(node.isAccessibilityElement)),
                       @"accessibilityLabel" :
                           SKMutableObject(node.accessibilityLabel ?: @""),
                       @"accessibilityIdentifier" :
                           SKMutableObject(node.accessibilityIdentifier ?: @""),
                       @"accessibilityValue" :
                           SKMutableObject(node.accessibilityValue ?: @""),
                       @"accessibilityHint" :
                           SKMutableObject(node.accessibilityHint ?: @""),
                       @"accessibilityTraits" :
                           AccessibilityTraitsDict(node.accessibilityTraits),
                       @"accessibilityViewIsModal" :
                           SKMutableObject(@(node.accessibilityViewIsModal)),
                       @"shouldGroupAccessibilityChildren" : SKMutableObject(
                           @(node.shouldGroupAccessibilityChildren)),
                     }],
          !node.isYogaEnabled
              ? nil
              : [SKNamed
                    newWithName:@"YGLayout"
                      withValue:@{
                        @"direction" : SKMutableObject(
                            YGDirectionEnumMap[@(node.yoga.direction)]),
                        @"justifyContent" : SKMutableObject(
                            YGJustifyEnumMap[@(node.yoga.justifyContent)]),
                        @"aligns" : @{
                          @"alignContent" : SKMutableObject(
                              YGAlignEnumMap[@(node.yoga.alignContent)]),
                          @"alignItems" : SKMutableObject(
                              YGAlignEnumMap[@(node.yoga.alignItems)]),
                          @"alignSelf" : SKMutableObject(
                              YGAlignEnumMap[@(node.yoga.alignSelf)]),
                        },
                        @"position" : @{
                          @"type" : SKMutableObject(
                              YGPositionTypeEnumMap[@(node.yoga.position)]),
                          @"left" : SKYGValueObject(node.yoga.left),
                          @"top" : SKYGValueObject(node.yoga.top),
                          @"right" : SKYGValueObject(node.yoga.right),
                          @"bottom" : SKYGValueObject(node.yoga.bottom),
                          @"start" : SKYGValueObject(node.yoga.start),
                          @"end" : SKYGValueObject(node.yoga.end),
                        },
                        @"overflow" : SKMutableObject(
                            YGOverflowEnumMap[@(node.yoga.overflow)]),
                        @"display" : SKMutableObject(
                            YGDisplayEnumMap[@(node.yoga.display)]),
                        @"flex" : @{
                          @"flexDirection" :
                              SKMutableObject(YGFlexDirectionEnumMap[
                                  @(node.yoga.flexDirection)]),
                          @"flexWrap" : SKMutableObject(
                              YGWrapEnumMap[@(node.yoga.flexWrap)]),
                          @"flexGrow" : SKMutableObject(@(node.yoga.flexGrow)),
                          @"flexShrink" :
                              SKMutableObject(@(node.yoga.flexShrink)),
                          @"flexBasis" : SKYGValueObject(node.yoga.flexBasis),
                        },
                        @"margin" : @{
                          @"left" : SKYGValueObject(node.yoga.marginLeft),
                          @"top" : SKYGValueObject(node.yoga.marginTop),
                          @"right" : SKYGValueObject(node.yoga.marginRight),
                          @"bottom" : SKYGValueObject(node.yoga.marginBottom),
                          @"start" : SKYGValueObject(node.yoga.marginStart),
                          @"end" : SKYGValueObject(node.yoga.marginEnd),
                          @"horizontal" :
                              SKYGValueObject(node.yoga.marginHorizontal),
                          @"vertical" :
                              SKYGValueObject(node.yoga.marginVertical),
                          @"all" : SKYGValueObject(node.yoga.margin),
                        },
                        @"padding" : @{
                          @"left" : SKYGValueObject(node.yoga.paddingLeft),
                          @"top" : SKYGValueObject(node.yoga.paddingTop),
                          @"right" : SKYGValueObject(node.yoga.paddingRight),
                          @"bottom" : SKYGValueObject(node.yoga.paddingBottom),
                          @"start" : SKYGValueObject(node.yoga.paddingStart),
                          @"end" : SKYGValueObject(node.yoga.paddingEnd),
                          @"horizontal" :
                              SKYGValueObject(node.yoga.paddingHorizontal),
                          @"vertical" :
                              SKYGValueObject(node.yoga.paddingVertical),
                          @"all" : SKYGValueObject(node.yoga.padding),
                        },
                        @"border" : @{
                          @"leftWidth" :
                              SKMutableObject(@(node.yoga.borderLeftWidth)),
                          @"topWidth" :
                              SKMutableObject(@(node.yoga.borderTopWidth)),
                          @"rightWidth" :
                              SKMutableObject(@(node.yoga.borderRightWidth)),
                          @"bottomWidth" :
                              SKMutableObject(@(node.yoga.borderBottomWidth)),
                          @"startWidth" :
                              SKMutableObject(@(node.yoga.borderStartWidth)),
                          @"endWidth" :
                              SKMutableObject(@(node.yoga.borderEndWidth)),
                          @"all" : SKMutableObject(@(node.yoga.borderWidth)),
                        },
                        @"dimensions" : @{
                          @"width" : SKYGValueObject(node.yoga.width),
                          @"height" : SKYGValueObject(node.yoga.height),
                          @"minWidth" : SKYGValueObject(node.yoga.minWidth),
                          @"minHeight" : SKYGValueObject(node.yoga.minHeight),
                          @"maxWidth" : SKYGValueObject(node.yoga.maxWidth),
                          @"maxHeight" : SKYGValueObject(node.yoga.maxHeight),
                        },
                        @"aspectRatio" :
                            SKMutableObject(@(node.yoga.aspectRatio)),
                        @"resolvedDirection" : SKObject(
                            YGDirectionEnumMap[@(node.yoga.resolvedDirection)]),
                      }],
          nil];
}

- (NSDictionary<NSString*, SKNodeUpdateData>*)dataMutationsForNode:
    (UIView*)node {
  NSDictionary<NSString*, SKNodeUpdateData>* dataMutations = @{
    // UIView
    @"UIView.alpha" : ^(NSNumber* value){
        node.alpha = [value floatValue];
}
,
    @"UIView.backgroundColor": ^(NSNumber *value) {
      node.backgroundColor = [UIColor fromSonarValue: value];
    },
    @"UIView.frame.origin.y": ^(NSNumber *value) {
      CGRect frame = node.frame;
      frame.origin.y = [value floatValue];
      node.frame = frame;
    },
    @"UIView.frame.origin.x": ^(NSNumber *value) {
      CGRect frame = node.frame;
      frame.origin.x = [value floatValue];
      node.frame = frame;
    },
    @"UIView.frame.size.width": ^(NSNumber *value) {
      CGRect frame = node.frame;
      frame.size.width = [value floatValue];
      node.frame = frame;
    },
    @"UIView.frame.size.height": ^(NSNumber *value) {
      CGRect frame = node.frame;
      frame.size.width = [value floatValue];
      node.frame = frame;
    },
    // CALayer
    @"CALayer.shadowColor": ^(NSNumber *value) {
      node.layer.shadowColor = [UIColor fromSonarValue:value].CGColor;
    },
    @"CALayer.shadowOpacity": ^(NSNumber *value) {
      node.layer.shadowOpacity = [value floatValue];
    },
    @"CALayer.shadowRadius": ^(NSNumber *value) {
      node.layer.shadowRadius = [value floatValue];
    },
    @"CALayer.shadowOffset.width": ^(NSNumber *value) {
      CGSize offset = node.layer.shadowOffset;
      offset.width = [value floatValue];
      node.layer.shadowOffset = offset;
    },
    @"CALayer.shadowOffset.height": ^(NSNumber *value) {
      CGSize offset = node.layer.shadowOffset;
      offset.height = [value floatValue];
      node.layer.shadowOffset = offset;
    },
    @"CALayer.backgroundColor": ^(NSNumber *value) {
      node.layer.backgroundColor = [UIColor fromSonarValue:value].CGColor;
    },
    @"CALayer.borderColor": ^(NSNumber *value) {
      node.layer.borderColor = [UIColor fromSonarValue:value].CGColor;
    },
    @"CALayer.borderWidth": ^(NSNumber *value) {
      node.layer.borderWidth = [value floatValue];
    },
    @"CALayer.cornerRadius": ^(NSNumber *value) {
      node.layer.cornerRadius = [value floatValue];
    },
    @"CALayer.masksToBounds": ^(NSNumber *value) {
      node.layer.masksToBounds = [value boolValue];
    },
    // YGLayout
    @"YGLayout.direction": APPLY_ENUM_TO_YOGA_PROPERTY(direction, YGDirection),
    @"YGLayout.justifyContent": APPLY_ENUM_TO_YOGA_PROPERTY(justifyContent, YGJustify),
    @"YGLayout.aligns.alignContent": APPLY_ENUM_TO_YOGA_PROPERTY(alignContent, YGAlign),
    @"YGLayout.aligns.alignItems": APPLY_ENUM_TO_YOGA_PROPERTY(alignItems, YGAlign),
    @"YGLayout.aligns.alignSelf": APPLY_ENUM_TO_YOGA_PROPERTY(alignSelf, YGAlign),
    @"YGLayout.position.type": APPLY_ENUM_TO_YOGA_PROPERTY(position, YGPositionType),
    @"YGLayout.position.left.value": APPLY_VALUE_TO_YGVALUE(left),
    @"YGLayout.position.left.unit": APPLY_UNIT_TO_YGVALUE(left, YGUnit),
    @"YGLayout.position.top.value": APPLY_VALUE_TO_YGVALUE(top),
    @"YGLayout.position.top.unit": APPLY_UNIT_TO_YGVALUE(top, YGUnit),
    @"YGLayout.position.right.value": APPLY_VALUE_TO_YGVALUE(right),
    @"YGLayout.position.right.unit": APPLY_UNIT_TO_YGVALUE(right, YGUnit),
    @"YGLayout.position.bottom.value": APPLY_VALUE_TO_YGVALUE(bottom),
    @"YGLayout.position.bottom.unit": APPLY_UNIT_TO_YGVALUE(bottom, YGUnit),
    @"YGLayout.position.start.value": APPLY_VALUE_TO_YGVALUE(start),
    @"YGLayout.position.start.unit": APPLY_UNIT_TO_YGVALUE(start, YGUnit),
    @"YGLayout.position.end.value": APPLY_VALUE_TO_YGVALUE(end),
    @"YGLayout.position.end.unit": APPLY_UNIT_TO_YGVALUE(end, YGUnit),
    @"YGLayout.overflow": APPLY_ENUM_TO_YOGA_PROPERTY(overflow, YGOverflow),
    @"YGLayout.display": APPLY_ENUM_TO_YOGA_PROPERTY(display, YGDisplay),
    @"YGLayout.flex.flexDirection": APPLY_ENUM_TO_YOGA_PROPERTY(flexDirection, YGFlexDirection),
    @"YGLayout.flex.flexWrap": APPLY_ENUM_TO_YOGA_PROPERTY(flexWrap, YGWrap),
    @"YGLayout.flex.flexGrow": ^(NSNumber *value) {
      node.yoga.flexGrow = [value floatValue];
    },
    @"YGLayout.flex.flexShrink": ^(NSNumber *value) {
      node.yoga.flexShrink = [value floatValue];
    },
    @"YGLayout.flex.flexBasis.value": APPLY_VALUE_TO_YGVALUE(flexBasis),
    @"YGLayout.flex.flexBasis.unit": APPLY_UNIT_TO_YGVALUE(flexBasis, YGUnit),
    @"YGLayout.margin.left.value": APPLY_VALUE_TO_YGVALUE(marginLeft),
    @"YGLayout.margin.left.unit": APPLY_UNIT_TO_YGVALUE(marginLeft, YGUnit),
    @"YGLayout.margin.top.value": APPLY_VALUE_TO_YGVALUE(marginTop),
    @"YGLayout.margin.top.unit": APPLY_UNIT_TO_YGVALUE(marginTop, YGUnit),
    @"YGLayout.margin.right.value": APPLY_VALUE_TO_YGVALUE(marginRight),
    @"YGLayout.margin.right.unit": APPLY_UNIT_TO_YGVALUE(marginRight, YGUnit),
    @"YGLayout.margin.bottom.value": APPLY_VALUE_TO_YGVALUE(marginBottom),
    @"YGLayout.margin.bottom.unit": APPLY_UNIT_TO_YGVALUE(marginBottom, YGUnit),
    @"YGLayout.margin.start.value": APPLY_VALUE_TO_YGVALUE(marginStart),
    @"YGLayout.margin.start.unit": APPLY_UNIT_TO_YGVALUE(marginStart, YGUnit),
    @"YGLayout.margin.end.value": APPLY_VALUE_TO_YGVALUE(marginEnd),
    @"YGLayout.margin.end.unit": APPLY_UNIT_TO_YGVALUE(marginEnd, YGUnit),
    @"YGLayout.margin.horizontal.value": APPLY_VALUE_TO_YGVALUE(marginHorizontal),
    @"YGLayout.margin.horizontal.unit": APPLY_UNIT_TO_YGVALUE(marginHorizontal, YGUnit),
    @"YGLayout.margin.vertical.value": APPLY_VALUE_TO_YGVALUE(marginVertical),
    @"YGLayout.margin.vertical.unit": APPLY_UNIT_TO_YGVALUE(marginVertical, YGUnit),
    @"YGLayout.margin.all.value": APPLY_VALUE_TO_YGVALUE(margin),
    @"YGLayout.margin.all.unit": APPLY_UNIT_TO_YGVALUE(margin, YGUnit),
    @"YGLayout.padding.left.value": APPLY_VALUE_TO_YGVALUE(paddingLeft),
    @"YGLayout.padding.left.unit": APPLY_UNIT_TO_YGVALUE(paddingLeft, YGUnit),
    @"YGLayout.padding.top.value": APPLY_VALUE_TO_YGVALUE(paddingTop),
    @"YGLayout.padding.top.unit": APPLY_UNIT_TO_YGVALUE(paddingTop, YGUnit),
    @"YGLayout.padding.right.value": APPLY_VALUE_TO_YGVALUE(paddingRight),
    @"YGLayout.padding.right.unit": APPLY_UNIT_TO_YGVALUE(paddingRight, YGUnit),
    @"YGLayout.padding.bottom.value": APPLY_VALUE_TO_YGVALUE(paddingBottom),
    @"YGLayout.padding.bottom.unit": APPLY_UNIT_TO_YGVALUE(paddingBottom, YGUnit),
    @"YGLayout.padding.start.value": APPLY_VALUE_TO_YGVALUE(paddingStart),
    @"YGLayout.padding.start.unit": APPLY_UNIT_TO_YGVALUE(paddingStart, YGUnit),
    @"YGLayout.padding.end.value": APPLY_VALUE_TO_YGVALUE(paddingEnd),
    @"YGLayout.padding.end.unit": APPLY_UNIT_TO_YGVALUE(paddingEnd, YGUnit),
    @"YGLayout.padding.horizontal.value": APPLY_VALUE_TO_YGVALUE(paddingHorizontal),
    @"YGLayout.padding.horizontal.unit": APPLY_UNIT_TO_YGVALUE(paddingHorizontal, YGUnit),
    @"YGLayout.padding.vertical.value": APPLY_VALUE_TO_YGVALUE(paddingVertical),
    @"YGLayout.padding.vertical.unit": APPLY_UNIT_TO_YGVALUE(paddingVertical, YGUnit),
    @"YGLayout.padding.all.value": APPLY_VALUE_TO_YGVALUE(padding),
    @"YGLayout.padding.all.unit": APPLY_UNIT_TO_YGVALUE(padding, YGUnit),
    @"YGLayout.border.leftWidth": ^(NSNumber *value) {
      node.yoga.borderLeftWidth = [value floatValue];
    },
    @"YGLayout.border.topWidth": ^(NSNumber *value) {
      node.yoga.borderTopWidth = [value floatValue];
    },
    @"YGLayout.border.rightWidth": ^(NSNumber *value) {
      node.yoga.borderRightWidth = [value floatValue];
    },
    @"YGLayout.border.bottomWidth": ^(NSNumber *value) {
      node.yoga.borderBottomWidth = [value floatValue];
    },
    @"YGLayout.border.startWidth": ^(NSNumber *value) {
      node.yoga.borderStartWidth = [value floatValue];
    },
    @"YGLayout.border.endWidth": ^(NSNumber *value) {
      node.yoga.borderEndWidth = [value floatValue];
    },
    @"YGLayout.border.all": ^(NSNumber *value) {
      node.yoga.borderWidth = [value floatValue];
    },
    @"YGLayout.dimensions.width.value": APPLY_VALUE_TO_YGVALUE(width),
    @"YGLayout.dimensions.width.unit": APPLY_UNIT_TO_YGVALUE(width, YGUnit),
    @"YGLayout.dimensions.height.value": APPLY_VALUE_TO_YGVALUE(height),
    @"YGLayout.dimensions.height.unit": APPLY_UNIT_TO_YGVALUE(height, YGUnit),
    @"YGLayout.dimensions.minWidth.value": APPLY_VALUE_TO_YGVALUE(minWidth),
    @"YGLayout.dimensions.minWidth.unit": APPLY_UNIT_TO_YGVALUE(minWidth, YGUnit),
    @"YGLayout.dimensions.minHeight.value": APPLY_VALUE_TO_YGVALUE(minHeight),
    @"YGLayout.dimensions.minHeight.unit": APPLY_UNIT_TO_YGVALUE(minHeight, YGUnit),
    @"YGLayout.dimensions.maxWidth.value": APPLY_VALUE_TO_YGVALUE(maxWidth),
    @"YGLayout.dimensions.maxWidth.unit": APPLY_UNIT_TO_YGVALUE(maxWidth, YGUnit),
    @"YGLayout.dimensions.maxHeight.value": APPLY_VALUE_TO_YGVALUE(maxHeight),
    @"YGLayout.dimensions.maxHeight.unit": APPLY_UNIT_TO_YGVALUE(maxHeight, YGUnit),
    @"YGLayout.aspectRatio": ^(NSNumber *value) {
      node.yoga.aspectRatio = [value floatValue];
    },
    // Accessibility
    @"Accessibility.isAccessibilityElement": ^(NSNumber *value) {
      node.isAccessibilityElement = [value boolValue];
    },
    @"Accessibility.accessibilityLabel": ^(NSString *value) {
      node.accessibilityLabel = value;
    },
    @"Accessibility.accessibilityValue": ^(NSString *value) {
      node.accessibilityValue = value;
    },
    @"Accessibility.accessibilityHint": ^(NSString *value) {
      node.accessibilityHint = value;
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitButton": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitButton, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitLink": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitLink, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitHeader": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitHeader, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitSearchField": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitSearchField, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitImage": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitImage, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitSelected": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitSelected, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitPlaysSound": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitPlaysSound, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitKeyboardKey": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitKeyboardKey, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitStaticText": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitStaticText, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitSummaryElement": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitSummaryElement, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitNotEnabled": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitNotEnabled, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitUpdatesFrequently": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitUpdatesFrequently, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitStartsMediaSession": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitStartsMediaSession, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitAdjustable": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitAdjustable, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitAllowsDirectInteraction": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitAllowsDirectInteraction, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitCausesPageTurn": ^(NSNumber *value) {
      node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitCausesPageTurn, [value boolValue]);
    },
    @"Accessibility.accessibilityTraits.UIAccessibilityTraitTabBar": ^(NSNumber *value) {
      if (@available(iOS 10.0, *)) {
        node.accessibilityTraits = AccessibilityTraitsToggle(node.accessibilityTraits, UIAccessibilityTraitTabBar, [value boolValue]);
      }
    },
    @"Accessibility.accessibilityViewIsModal": ^(NSNumber *value) {
      node.accessibilityViewIsModal = [value boolValue];
    },
    @"Accessibility.shouldGroupAccessibilityChildren": ^(NSNumber *value) {
      node.shouldGroupAccessibilityChildren = [value boolValue];
    },
}
;
if (@available(iOS 10.0, *)) {
  NSMutableDictionary<NSString*, SKNodeUpdateData>* latestDataMutations =
      [dataMutations mutableCopy];
  latestDataMutations
      [@"Accessibility.accessibilityTraits.UIAccessibilityTraitTabBar"] =
          ^(NSNumber* value) {
            node.accessibilityTraits = AccessibilityTraitsToggle(
                node.accessibilityTraits,
                UIAccessibilityTraitTabBar,
                [value boolValue]);
          };
  dataMutations = latestDataMutations;
}
return dataMutations;
}

- (NSArray<SKNamed<NSString*>*>*)attributesForNode:(UIView*)node {
  return @[ [SKNamed newWithName:@"addr"
                       withValue:[NSString stringWithFormat:@"%p", node]] ];
}

- (void)setHighlighted:(BOOL)highlighted forNode:(UIView*)node {
  SKHighlightOverlay* overlay = [SKHighlightOverlay sharedInstance];
  if (highlighted == YES) {
    [overlay mountInView:node withFrame:node.bounds];
  } else {
    [overlay unmount];
  }
}

- (void)hitTest:(SKTouch*)touch forNode:(UIView*)node {
  bool finish = true;
  for (NSInteger index = [self childCountForNode:node] - 1; index >= 0;
       index--) {
    id<NSObject> childNode = [self childForNode:node atIndex:index];
    UIView* viewForNode = nil;

    if ([childNode isKindOfClass:[UIViewController class]]) {
      UIViewController* child = (UIViewController*)childNode;
      viewForNode = child.view;
    } else {
      viewForNode = (UIView*)childNode;
    }

    if (viewForNode.isHidden || viewForNode.alpha <= 0 ||
        [[viewForNode class] isEqual:[SKHiddenWindow class]]) {
      /*SKHiddenWindow is the pink overlay which is added in window to capture
       the gestures.*/
      continue;
    }

    if ([touch containedIn:viewForNode.frame]) {
      [touch continueWithChildIndex:index withOffset:viewForNode.frame.origin];
      finish = false;
    }
  }

  if (finish) {
    [touch finish];
  }
}

static void initEnumDictionaries() {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    YGDirectionEnumMap = @{
      @(YGDirectionInherit) : @"inherit",
      @(YGDirectionLTR) : @"LTR",
      @(YGDirectionRTL) : @"RTL",
    };

    YGFlexDirectionEnumMap = @{
      @(YGFlexDirectionColumn) : @"column",
      @(YGFlexDirectionColumnReverse) : @"column-reverse",
      @(YGFlexDirectionRow) : @"row",
      @(YGFlexDirectionRowReverse) : @"row-reverse",
    };

    YGJustifyEnumMap = @{
      @(YGJustifyFlexStart) : @"flex-start",
      @(YGJustifyCenter) : @"center",
      @(YGJustifyFlexEnd) : @"flex-end",
      @(YGJustifySpaceBetween) : @"space-between",
      @(YGJustifySpaceAround) : @"space-around",
    };

    YGAlignEnumMap = @{
      @(YGAlignAuto) : @"auto",
      @(YGAlignFlexStart) : @"flex-start",
      @(YGAlignCenter) : @"end",
      @(YGAlignFlexEnd) : @"flex-end",
      @(YGAlignStretch) : @"stretch",
      @(YGAlignBaseline) : @"baseline",
      @(YGAlignSpaceBetween) : @"space-between",
      @(YGAlignSpaceAround) : @"space-around",
    };

    YGPositionTypeEnumMap = @{
      @(YGPositionTypeRelative) : @"relative",
      @(YGPositionTypeAbsolute) : @"absolute",
    };

    YGWrapEnumMap = @{
      @(YGWrapNoWrap) : @"no-wrap",
      @(YGWrapWrap) : @"wrap",
      @(YGWrapWrapReverse) : @"wrap-reverse",
    };

    YGOverflowEnumMap = @{
      @(YGOverflowVisible) : @"visible",
      @(YGOverflowHidden) : @"hidden",
      @(YGOverflowScroll) : @"scroll",
    };

    YGDisplayEnumMap = @{
      @(YGDisplayFlex) : @"flex",
      @(YGDisplayNone) : @"none",
    };

    YGUnitEnumMap = @{
      @(YGUnitUndefined) : @"undefined",
      @(YGUnitPoint) : @"point",
      @(YGUnitPercent) : @"percent",
      @(YGUnitAuto) : @"auto",
    };
  });
}

static NSDictionary* SKYGValueObject(YGValue value) {
  return @{
    @"value" : SKMutableObject(@(value.value)),
    @"unit" : SKMutableObject(YGUnitEnumMap[@(value.unit)]),
  };
}

/*
 Takes the originalTraits, and set all bits from toggleTraits to the toggleValue
 e.g. originalTraits = UIAccessibilityTraitButton | UIAccessibilityTraitSelected
      toggleTraits = UIAccessibilityTraitImage
      toggleValue = YES
      return value = UIAccessibilityTraitButton | UIAccessibilityTraitSelected |
 UIAccessibilityTraitImage
 */
static UIAccessibilityTraits AccessibilityTraitsToggle(
    UIAccessibilityTraits originalTraits,
    UIAccessibilityTraits toggleTraits,
    BOOL toggleValue) {
  // NEGATE all bits of toggleTraits from originalTraits and OR it against
  // either toggleTraits or 0 (UIAccessibilityTraitNone) based on toggleValue
  UIAccessibilityTraits bitsValue =
      toggleValue ? toggleTraits : UIAccessibilityTraitNone;
  return (originalTraits & ~(toggleTraits)) | bitsValue;
}

static NSDictionary* AccessibilityTraitsDict(
    UIAccessibilityTraits accessibilityTraits) {
  NSMutableDictionary* traitsDict = [NSMutableDictionary new];
  [traitsDict addEntriesFromDictionary:@{
    @"UIAccessibilityTraitButton" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitButton))),
    @"UIAccessibilityTraitLink" :
        SKMutableObject(@(!!(accessibilityTraits & UIAccessibilityTraitLink))),
    @"UIAccessibilityTraitHeader" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitHeader))),
    @"UIAccessibilityTraitSearchField" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitSearchField))),
    @"UIAccessibilityTraitImage" :
        SKMutableObject(@(!!(accessibilityTraits & UIAccessibilityTraitImage))),
    @"UIAccessibilityTraitSelected" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitSelected))),
    @"UIAccessibilityTraitPlaysSound" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitPlaysSound))),
    @"UIAccessibilityTraitKeyboardKey" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitKeyboardKey))),
    @"UIAccessibilityTraitStaticText" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitStaticText))),
    @"UIAccessibilityTraitSummaryElement" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitSummaryElement))),
    @"UIAccessibilityTraitNotEnabled" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitNotEnabled))),
    @"UIAccessibilityTraitUpdatesFrequently" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitUpdatesFrequently))),
    @"UIAccessibilityTraitStartsMediaSession" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitStartsMediaSession))),
    @"UIAccessibilityTraitAdjustable" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitAdjustable))),
    @"UIAccessibilityTraitAllowsDirectInteraction" : SKMutableObject(@(
        !!(accessibilityTraits & UIAccessibilityTraitAllowsDirectInteraction))),
    @"UIAccessibilityTraitCausesPageTurn" : SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitCausesPageTurn))),
  }];
  if (@available(iOS 10.0, *)) {
    traitsDict[@"UIAccessibilityTraitTabBar"] = SKMutableObject(
        @(!!(accessibilityTraits & UIAccessibilityTraitTabBar)));
  }
  return traitsDict;
}

@end

#endif
