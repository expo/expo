/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTParagraphComponentView.h"

#import <ABI38_0_0React/components/text/ParagraphComponentDescriptor.h>
#import <ABI38_0_0React/components/text/ParagraphProps.h>
#import <ABI38_0_0React/components/text/ParagraphState.h>
#import <ABI38_0_0React/components/text/RawTextComponentDescriptor.h>
#import <ABI38_0_0React/components/text/TextComponentDescriptor.h>
#import <ABI38_0_0React/core/LocalData.h>
#import <ABI38_0_0React/graphics/Geometry.h>
#import <ABI38_0_0React/textlayoutmanager/ABI38_0_0RCTTextLayoutManager.h>
#import <ABI38_0_0React/textlayoutmanager/TextLayoutManager.h>
#import "ABI38_0_0RCTConversions.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@implementation ABI38_0_0RCTParagraphComponentView {
  ParagraphShadowNode::ConcreteState::Shared _state;
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

#pragma mark - ABI38_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ParagraphComponentDescriptor>();
}

+ (std::vector<ABI38_0_0facebook::ABI38_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {concreteComponentDescriptorProvider<RawTextComponentDescriptor>(),
          concreteComponentDescriptorProvider<TextComponentDescriptor>()};
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &paragraphProps = std::static_pointer_cast<const ParagraphProps>(props);

  assert(paragraphProps);
  _paragraphAttributes = paragraphProps->paragraphAttributes;

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<ParagraphShadowNode::ConcreteState const>(state);
  [self setNeedsDisplay];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
}

- (void)drawRect:(CGRect)rect
{
  if (!_state) {
    return;
  }

  SharedTextLayoutManager textLayoutManager = _state->getData().layoutManager;
  ABI38_0_0RCTTextLayoutManager *nativeTextLayoutManager =
      (__bridge ABI38_0_0RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();

  CGRect frame = ABI38_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_state->getData().attributedString
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = ABI38_0_0RCTNSStringFromStringNilIfEmpty(_props->accessibilityLabel);
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }

  if (!_state) {
    return nil;
  }

  return ABI38_0_0RCTNSStringFromString(_state->getData().attributedString.getString());
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  if (!_state) {
    return _eventEmitter;
  }

  SharedTextLayoutManager textLayoutManager = _state->getData().layoutManager;
  ABI38_0_0RCTTextLayoutManager *nativeTextLayoutManager =
      (__bridge ABI38_0_0RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();
  CGRect frame = ABI38_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  SharedEventEmitter eventEmitter =
      [nativeTextLayoutManager getEventEmitterWithAttributeString:_state->getData().attributedString
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
