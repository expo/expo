/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTInputAccessoryComponentView.h"

#import <ABI49_0_0React/ABI49_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceTouchHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/inputaccessory/InputAccessoryComponentDescriptor.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/rncore/Props.h>
#import "ABI49_0_0RCTInputAccessoryContentView.h"

#import "ABI49_0_0RCTFabricComponentsPlugins.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

static UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *_Nullable ABI49_0_0RCTFindTextInputWithNativeId(UIView *view, NSString *nativeId)
{
  if ([view respondsToSelector:@selector(inputAccessoryViewID)] &&
      [view respondsToSelector:@selector(setInputAccessoryView:)]) {
    UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *typed = (UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *)view;
    if (!nativeId || [typed.inputAccessoryViewID isEqualToString:nativeId]) {
      return typed;
    }
  }

  for (UIView *subview in view.subviews) {
    UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *result = ABI49_0_0RCTFindTextInputWithNativeId(subview, nativeId);
    if (result) {
      return result;
    }
  }

  return nil;
}

@implementation ABI49_0_0RCTInputAccessoryComponentView {
  InputAccessoryShadowNode::ConcreteState::Shared _state;
  ABI49_0_0RCTInputAccessoryContentView *_contentView;
  ABI49_0_0RCTSurfaceTouchHandler *_touchHandler;
  UIView<ABI49_0_0RCTBackedTextInputViewProtocol> __weak *_textInput;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const InputAccessoryProps>();
    _props = defaultProps;
    _contentView = [ABI49_0_0RCTInputAccessoryContentView new];
    _touchHandler = [ABI49_0_0RCTSurfaceTouchHandler new];
    [_touchHandler attachToView:_contentView];
  }

  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (self.window && !_textInput) {
    if (self.nativeId) {
      _textInput = ABI49_0_0RCTFindTextInputWithNativeId(self.window, self.nativeId);
      _textInput.inputAccessoryView = _contentView;
    } else {
      _textInput = ABI49_0_0RCTFindTextInputWithNativeId(_contentView, nil);
    }

    if (!self.nativeId) {
      [self becomeFirstResponder];
    }
  }
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (UIView *)inputAccessoryView
{
  return _contentView;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<InputAccessoryComponentDescriptor>();
}

- (void)mountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldInputAccessoryProps = *std::static_pointer_cast<InputAccessoryProps const>(_props);
  auto const &newInputAccessoryProps = *std::static_pointer_cast<InputAccessoryProps const>(props);

  if (newInputAccessoryProps.backgroundColor != oldInputAccessoryProps.backgroundColor) {
    _contentView.backgroundColor = ABI49_0_0RCTUIColorFromSharedColor(newInputAccessoryProps.backgroundColor);
  }

  [super updateProps:props oldProps:oldProps];
  self.hidden = true;
}

- (void)updateState:(const ABI49_0_0facebook::ABI49_0_0React::State::Shared &)state
           oldState:(const ABI49_0_0facebook::ABI49_0_0React::State::Shared &)oldState
{
  _state = std::static_pointer_cast<InputAccessoryShadowNode::ConcreteState const>(state);
  CGSize oldScreenSize = ABI49_0_0RCTCGSizeFromSize(_state->getData().viewportSize);
  CGSize viewportSize = ABI49_0_0RCTViewportSize();
  viewportSize.height = std::nan("");
  if (oldScreenSize.width != viewportSize.width) {
    auto stateData = InputAccessoryState{ABI49_0_0RCTSizeFromCGSize(viewportSize)};
    _state->updateState(std::move(stateData));
  }
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  [_contentView setFrame:ABI49_0_0RCTCGRectFromRect(layoutMetrics.getContentFrame())];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _textInput = nil;
}

@end

Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RCTInputAccessoryCls(void)
{
  return ABI49_0_0RCTInputAccessoryComponentView.class;
}
