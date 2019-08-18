/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTParagraphComponentView.h"

#import <ABI31_0_0fabric/ABI31_0_0components/text/ParagraphLocalData.h>
#import <ABI31_0_0fabric/ABI31_0_0components/text/ParagraphProps.h>
#import <ABI31_0_0fabric/ABI31_0_0core/LocalData.h>
#import <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>
#import <ABI31_0_0fabric/ABI31_0_0textlayoutmanager/TextLayoutManager.h>
#import <ABI31_0_0fabric/ABI31_0_0textlayoutmanager/ABI31_0_0RCTTextLayoutManager.h>
#import "ABI31_0_0RCTConversions.h"

using namespace facebook::ReactABI31_0_0;

@implementation ABI31_0_0RCTParagraphComponentView {
  SharedParagraphLocalData _paragraphLocalData;
  ParagraphAttributes _paragraphAttributes;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;
    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  [super updateProps:props oldProps:oldProps];
  auto paragraphProps = std::static_pointer_cast<const ParagraphProps>(props);
  assert(paragraphProps);
  _paragraphAttributes = paragraphProps->paragraphAttributes;
}

- (void)updateLocalData:(SharedLocalData)localData
           oldLocalData:(SharedLocalData)oldLocalData
{
  _paragraphLocalData = std::static_pointer_cast<const ParagraphLocalData>(localData);
  assert(_paragraphLocalData);
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  if (!_paragraphLocalData) {
    return;
  }

  SharedTextLayoutManager textLayoutManager =
    _paragraphLocalData->getTextLayoutManager();
  ABI31_0_0RCTTextLayoutManager *nativeTextLayoutManager =
    (__bridge ABI31_0_0RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();

  CGRect frame = ABI31_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_paragraphLocalData->getAttributedString()
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }

  if (!_paragraphLocalData) {
    return nil;
  }

  return ABI31_0_0RCTNSStringFromString(_paragraphLocalData->getAttributedString().getString());
}

@end
