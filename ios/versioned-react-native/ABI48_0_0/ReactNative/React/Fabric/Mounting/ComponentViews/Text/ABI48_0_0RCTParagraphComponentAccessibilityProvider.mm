/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTParagraphComponentAccessibilityProvider.h"

#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/text/ParagraphProps.h>
#import <ABI48_0_0React/ABI48_0_0renderer/textlayoutmanager/ABI48_0_0RCTAttributedTextUtils.h>
#import <ABI48_0_0React/ABI48_0_0renderer/textlayoutmanager/ABI48_0_0RCTTextLayoutManager.h>
#import <ABI48_0_0React/ABI48_0_0renderer/textlayoutmanager/TextLayoutManager.h>

#import "ABI48_0_0RCTAccessibilityElement.h"
#import "ABI48_0_0RCTConversions.h"
#import "ABI48_0_0RCTFabricComponentsPlugins.h"
#import "ABI48_0_0RCTLocalizationProvider.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@implementation ABI48_0_0RCTParagraphComponentAccessibilityProvider {
  NSMutableArray<UIAccessibilityElement *> *_accessibilityElements;
  AttributedString _attributedString;
  ABI48_0_0RCTTextLayoutManager *_layoutManager;
  ParagraphAttributes _paragraphAttributes;
  CGRect _frame;
  __weak UIView *_view;
}

- (instancetype)initWithString:(ABI48_0_0facebook::ABI48_0_0React::AttributedString)attributedString
                 layoutManager:(ABI48_0_0RCTTextLayoutManager *)layoutManager
           paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                         frame:(CGRect)frame
                          view:(UIView *)view
{
  if (self = [super init]) {
    _attributedString = attributedString;
    _layoutManager = layoutManager;
    _paragraphAttributes = paragraphAttributes;
    _frame = frame;
    _view = view;
  }
  return self;
}

- (NSArray<UIAccessibilityElement *> *)accessibilityElements
{
  if (_accessibilityElements) {
    return _accessibilityElements;
  }

  __block NSInteger numberOfLinks = 0;
  __block NSInteger numberOfButtons = 0;
  __block NSString *truncatedText;
  // build an array of the accessibleElements
  NSMutableArray<UIAccessibilityElement *> *elements = [NSMutableArray new];

  NSString *accessibilityLabel = _view.accessibilityLabel;
  if (accessibilityLabel.length == 0) {
    accessibilityLabel = ABI48_0_0RCTNSStringFromString(_attributedString.getString());
  }
  // add first element has the text for the whole textview in order to read out the whole text
  ABI48_0_0RCTAccessibilityElement *firstElement =
      [[ABI48_0_0RCTAccessibilityElement alloc] initWithAccessibilityContainer:_view.superview];
  firstElement.isAccessibilityElement = YES;
  firstElement.accessibilityTraits = _view.accessibilityTraits;
  firstElement.accessibilityLabel = accessibilityLabel;
  firstElement.accessibilityLanguage = _view.accessibilityLanguage;
  firstElement.accessibilityFrame = UIAccessibilityConvertFrameToScreenCoordinates(_view.bounds, _view);
  [firstElement setAccessibilityActivationPoint:CGPointMake(
                                                    firstElement.accessibilityFrame.origin.x + 1.0,
                                                    firstElement.accessibilityFrame.origin.y + 1.0)];
  [elements addObject:firstElement];

  // add additional elements for those parts of text with embedded link so VoiceOver could specially recognize links

  [_layoutManager getRectWithAttributedString:_attributedString
                          paragraphAttributes:_paragraphAttributes
                           enumerateAttribute:ABI48_0_0RCTTextAttributesAccessibilityRoleAttributeName
                                        frame:_frame
                                   usingBlock:^(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value) {
                                     if ([fragmentText isEqualToString:firstElement.accessibilityLabel]) {
                                       // The fragment is the entire paragraph. This is handled as `firstElement`.
                                       return;
                                     }
                                     if ((![value isEqualToString:@"button"] && ![value isEqualToString:@"link"])) {
                                       return;
                                     }
                                     if ([value isEqualToString:@"button"] &&
                                         ([fragmentText isEqualToString:@"See Less"] ||
                                          [fragmentText isEqualToString:@"See More"])) {
                                       truncatedText = fragmentText;
                                       return;
                                     }
                                     ABI48_0_0RCTAccessibilityElement *element =
                                         [[ABI48_0_0RCTAccessibilityElement alloc] initWithAccessibilityContainer:self->_view];
                                     element.isAccessibilityElement = YES;
                                     if ([value isEqualToString:@"link"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitLink;
                                       numberOfLinks++;
                                     } else if ([value isEqualToString:@"button"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitButton;
                                       numberOfButtons++;
                                     }
                                     element.accessibilityLabel = fragmentText;
                                     element.frame = fragmentRect;
                                     [elements addObject:element];
                                   }];

  if (numberOfLinks > 0 || numberOfButtons > 0) {
    __block NSInteger indexOfLink = 1;
    __block NSInteger indexOfButton = 1;
    [elements enumerateObjectsUsingBlock:^(UIAccessibilityElement *element, NSUInteger idx, BOOL *_Nonnull stop) {
      if (idx == 0) {
        return;
      }
      if (element.accessibilityTraits & UIAccessibilityTraitLink) {
        NSString *test = [ABI48_0_0RCTLocalizationProvider ABI48_0_0RCTLocalizedString:@"Link %ld of %ld."
                                                     withDescription:@"index of the link"];
        element.accessibilityHint = [NSString stringWithFormat:test, (long)indexOfLink++, (long)numberOfLinks];
      } else {
        element.accessibilityHint =
            [NSString stringWithFormat:[ABI48_0_0RCTLocalizationProvider ABI48_0_0RCTLocalizedString:@"Button %ld of %ld."
                                                                   withDescription:@"index of the button"],
                                       (long)indexOfButton++,
                                       (long)numberOfButtons];
      }
    }];
  }

  if (numberOfLinks > 0 && numberOfButtons > 0) {
    firstElement.accessibilityHint =
        [ABI48_0_0RCTLocalizationProvider ABI48_0_0RCTLocalizedString:@"Links and buttons are found, swipe to move to them."
                                    withDescription:@"accessibility hint for links and buttons inside text"];

  } else if (numberOfLinks > 0) {
    NSString *firstElementHint = (numberOfLinks == 1)
        ? [ABI48_0_0RCTLocalizationProvider ABI48_0_0RCTLocalizedString:@"One link found, swipe to move to the link."
                                      withDescription:@"accessibility hint for one link inside text"]
        : [NSString stringWithFormat:[ABI48_0_0RCTLocalizationProvider
                                         ABI48_0_0RCTLocalizedString:@"%ld links found, swipe to move to the first link."
                                            withDescription:@"accessibility hint for multiple links inside text"],
                                     (long)numberOfLinks];
    firstElement.accessibilityHint = firstElementHint;

  } else if (numberOfButtons > 0) {
    NSString *firstElementHint = (numberOfButtons == 1)
        ? [ABI48_0_0RCTLocalizationProvider ABI48_0_0RCTLocalizedString:@"One button found, swipe to move to the button."
                                      withDescription:@"accessibility hint for one button inside text"]
        : [NSString stringWithFormat:[ABI48_0_0RCTLocalizationProvider
                                         ABI48_0_0RCTLocalizedString:@"%ld buttons found, swipe to move to the first button."
                                            withDescription:@"accessibility hint for multiple buttons inside text"],
                                     (long)numberOfButtons];
    firstElement.accessibilityHint = firstElementHint;
  }

  if (truncatedText && truncatedText.length > 0) {
    firstElement.accessibilityHint = (numberOfLinks > 0 || numberOfButtons > 0)
        ? [NSString
              stringWithFormat:@"%@ %@",
                               firstElement.accessibilityHint,
                               [ABI48_0_0RCTLocalizationProvider
                                   ABI48_0_0RCTLocalizedString:[NSString stringWithFormat:@"Double tap to %@.", truncatedText]
                                      withDescription:@"accessibility hint for truncated text with links or buttons"]]
        : [ABI48_0_0RCTLocalizationProvider ABI48_0_0RCTLocalizedString:[NSString stringWithFormat:@"Double tap to %@.", truncatedText]
                                      withDescription:@"accessibility hint for truncated text"];
  }

  // add accessible element for truncation attributed string for automation purposes only
  _accessibilityElements = elements;
  return _accessibilityElements;
}

- (BOOL)isUpToDate:(ABI48_0_0facebook::ABI48_0_0React::AttributedString)currentAttributedString
{
  return currentAttributedString == _attributedString;
}

@end
