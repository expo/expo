/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTParagraphComponentView.h"

#import <ReactABI34_0_0/components/text/ParagraphLocalData.h>
#import <ReactABI34_0_0/components/text/ParagraphProps.h>
#import <ReactABI34_0_0/components/text/ParagraphShadowNode.h>
#import <ReactABI34_0_0/core/LocalData.h>
#import <ReactABI34_0_0/graphics/Geometry.h>
#import <ReactABI34_0_0/textlayoutmanager/TextLayoutManager.h>
#import <ReactABI34_0_0/textlayoutmanager/ABI34_0_0RCTTextLayoutManager.h>
#import "ABI34_0_0RCTConversions.h"

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTParagraphComponentView {
  SharedParagraphLocalData _paragraphLocalData;
  ParagraphAttributes _paragraphAttributes;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ParagraphProps>();
    _props = defaultProps;

    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;
    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

#pragma mark - ABI34_0_0RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
  return ParagraphShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &paragraphProps = std::static_pointer_cast<const ParagraphProps>(props);

  [super updateProps:props oldProps:oldProps];

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

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _paragraphLocalData.reset();
}

- (void)drawRect:(CGRect)rect
{
  if (!_paragraphLocalData) {
    return;
  }

  SharedTextLayoutManager textLayoutManager =
    _paragraphLocalData->getTextLayoutManager();
  ABI34_0_0RCTTextLayoutManager *nativeTextLayoutManager =
    (__bridge ABI34_0_0RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();

  CGRect frame = ABI34_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_paragraphLocalData->getAttributedString()
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel =
    ABI34_0_0RCTNSStringFromStringNilIfEmpty(_props->accessibilityLabel);
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }

  if (!_paragraphLocalData) {
    return nil;
  }

  return ABI34_0_0RCTNSStringFromString(_paragraphLocalData->getAttributedString().getString());
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  if (!_paragraphLocalData) {
    return _eventEmitter;
  }

  SharedTextLayoutManager textLayoutManager = _paragraphLocalData->getTextLayoutManager();
  ABI34_0_0RCTTextLayoutManager *nativeTextLayoutManager = (__bridge ABI34_0_0RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();
  CGRect frame = ABI34_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  SharedEventEmitter eventEmitter =
    [nativeTextLayoutManager getEventEmitterWithAttributeString:_paragraphLocalData->getAttributedString()
                                            paragraphAttributes:_paragraphAttributes
                                                          frame:frame
                                                        atPoint:point];

  if (!eventEmitter) {
    return _eventEmitter;
  }

  assert(std::dynamic_pointer_cast<const TouchEventEmitter>(eventEmitter));
  return std::static_pointer_cast<const TouchEventEmitter>(eventEmitter);
}

@end
