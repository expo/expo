/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTParagraphComponentView.h"
#import "ABI44_0_0RCTParagraphComponentAccessibilityProvider.h"

#import <ABI44_0_0React/ABI44_0_0renderer/components/text/ParagraphComponentDescriptor.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/text/ParagraphProps.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/text/ParagraphState.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/text/RawTextComponentDescriptor.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/text/TextComponentDescriptor.h>
#import <ABI44_0_0React/ABI44_0_0renderer/graphics/Geometry.h>
#import <ABI44_0_0React/ABI44_0_0renderer/textlayoutmanager/ABI44_0_0RCTAttributedTextUtils.h>
#import <ABI44_0_0React/ABI44_0_0renderer/textlayoutmanager/ABI44_0_0RCTTextLayoutManager.h>
#import <ABI44_0_0React/ABI44_0_0renderer/textlayoutmanager/TextLayoutManager.h>
#import <ABI44_0_0React/ABI44_0_0utils/ManagedObjectWrapper.h>

#import "ABI44_0_0RCTConversions.h"
#import "ABI44_0_0RCTFabricComponentsPlugins.h"

using namespace ABI44_0_0facebook::ABI44_0_0React;

@implementation ABI44_0_0RCTParagraphComponentView {
  ParagraphShadowNode::ConcreteState::Shared _state;
  ParagraphAttributes _paragraphAttributes;
  ABI44_0_0RCTParagraphComponentAccessibilityProvider *_accessibilityProvider;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ParagraphProps>();
    _props = defaultProps;

    self.isAccessibilityElement = YES;
    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; attributedText = %@>", superDescription, self.attributedText];
}

- (NSAttributedString *_Nullable)attributedText
{
  if (!_state) {
    return nil;
  }

  return ABI44_0_0RCTNSAttributedStringFromAttributedString(_state->getData().attributedString);
}

#pragma mark - ABI44_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ParagraphComponentDescriptor>();
}

+ (std::vector<ABI44_0_0facebook::ABI44_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
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

  auto textLayoutManager = _state->getData().layoutManager;
  assert(textLayoutManager && "TextLayoutManager must not be `nullptr`.");

  if (!textLayoutManager) {
    return;
  }

  ABI44_0_0RCTTextLayoutManager *nativeTextLayoutManager =
      (ABI44_0_0RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());

  CGRect frame = ABI44_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_state->getData().attributedString
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = ABI44_0_0RCTNSStringFromStringNilIfEmpty(_props->accessibilityLabel);
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }

  if (!_state) {
    return nil;
  }

  return ABI44_0_0RCTNSStringFromString(_state->getData().attributedString.getString());
}

- (NSArray *)accessibilityElements
{
  if (!_state) {
    return [NSArray new];
  }

  auto &data = _state->getData();

  if (![_accessibilityProvider isUpToDate:data.attributedString]) {
    ABI44_0_0RCTTextLayoutManager *textLayoutManager =
        (ABI44_0_0RCTTextLayoutManager *)unwrapManagedObject(data.layoutManager->getNativeTextLayoutManager());
    CGRect frame = ABI44_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());
    _accessibilityProvider = [[ABI44_0_0RCTParagraphComponentAccessibilityProvider alloc] initWithString:data.attributedString
                                                                                  layoutManager:textLayoutManager
                                                                            paragraphAttributes:data.paragraphAttributes
                                                                                          frame:frame
                                                                                           view:self];
  }

  self.isAccessibilityElement = NO;
  return _accessibilityProvider.accessibilityElements;
}

- (UIAccessibilityTraits)accessibilityTraits
{
  return [super accessibilityTraits] | UIAccessibilityTraitStaticText;
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  if (!_state) {
    return _eventEmitter;
  }

  auto textLayoutManager = _state->getData().layoutManager;

  assert(textLayoutManager && "TextLayoutManager must not be `nullptr`.");

  if (!textLayoutManager) {
    return _eventEmitter;
  }

  ABI44_0_0RCTTextLayoutManager *nativeTextLayoutManager =
      (ABI44_0_0RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
  CGRect frame = ABI44_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  auto eventEmitter = [nativeTextLayoutManager getEventEmitterWithAttributeString:_state->getData().attributedString
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

Class<ABI44_0_0RCTComponentViewProtocol> ABI44_0_0RCTParagraphCls(void)
{
  return ABI44_0_0RCTParagraphComponentView.class;
}
