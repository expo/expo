/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTInputAccessoryComponentView.h"

#import <ABI44_0_0React/ABI44_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI44_0_0React/ABI44_0_0RCTConversions.h>
#import <ABI44_0_0React/ABI44_0_0RCTSurfaceTouchHandler.h>
#import <ABI44_0_0React/ABI44_0_0RCTUtils.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/inputaccessory/InputAccessoryComponentDescriptor.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/rncore/Props.h>
#import "ABI44_0_0RCTInputAccessoryContentView.h"

#import "ABI44_0_0RCTFabricComponentsPlugins.h"

using namespace ABI44_0_0facebook::ABI44_0_0React;

static UIView<ABI44_0_0RCTBackedTextInputViewProtocol> *_Nullable ABI44_0_0RCTFindTextInputWithNativeId(UIView *view, NSString *nativeId)
{
  if ([view respondsToSelector:@selector(inputAccessoryViewID)] &&
      [view respondsToSelector:@selector(setInputAccessoryView:)]) {
    UIView<ABI44_0_0RCTBackedTextInputViewProtocol> *typed = (UIView<ABI44_0_0RCTBackedTextInputViewProtocol> *)view;
    if (!nativeId || [typed.inputAccessoryViewID isEqualToString:nativeId]) {
      return typed;
    }
  }

  for (UIView *subview in view.subviews) {
    UIView<ABI44_0_0RCTBackedTextInputViewProtocol> *result = ABI44_0_0RCTFindTextInputWithNativeId(subview, nativeId);
    if (result) {
      return result;
    }
  }

  return nil;
}

@implementation ABI44_0_0RCTInputAccessoryComponentView {
  InputAccessoryShadowNode::ConcreteStateTeller _stateTeller;
  ABI44_0_0RCTInputAccessoryContentView *_contentView;
  ABI44_0_0RCTSurfaceTouchHandler *_touchHandler;
  UIView<ABI44_0_0RCTBackedTextInputViewProtocol> __weak *_textInput;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const InputAccessoryProps>();
    _props = defaultProps;
    _contentView = [ABI44_0_0RCTInputAccessoryContentView new];
    _touchHandler = [ABI44_0_0RCTSurfaceTouchHandler new];
    [_touchHandler attachToView:_contentView];
  }

  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (self.window && !_textInput) {
    if (self.nativeId) {
      _textInput = ABI44_0_0RCTFindTextInputWithNativeId(self.window, self.nativeId);
      _textInput.inputAccessoryView = _contentView;
    } else {
      _textInput = ABI44_0_0RCTFindTextInputWithNativeId(_contentView, nil);
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

#pragma mark - ABI44_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<InputAccessoryComponentDescriptor>();
}

- (void)mountChildComponentView:(UIView<ABI44_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI44_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldInputAccessoryProps = *std::static_pointer_cast<InputAccessoryProps const>(_props);
  auto const &newInputAccessoryProps = *std::static_pointer_cast<InputAccessoryProps const>(props);

  if (newInputAccessoryProps.backgroundColor != oldInputAccessoryProps.backgroundColor) {
    _contentView.backgroundColor = ABI44_0_0RCTUIColorFromSharedColor(newInputAccessoryProps.backgroundColor);
  }

  [super updateProps:props oldProps:oldProps];
  self.hidden = true;
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _stateTeller.setConcreteState(state);
  CGSize oldViewportSize = ABI44_0_0RCTCGSizeFromSize(_stateTeller.getData().value().viewportSize);
  CGSize viewportSize = ABI44_0_0RCTViewportSize();
  viewportSize.height = std::nan("");
  if (oldViewportSize.width != viewportSize.width) {
    auto stateData = InputAccessoryState{ABI44_0_0RCTSizeFromCGSize(viewportSize)};
    _stateTeller.updateState(std::move(stateData));
  }
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  [_contentView setFrame:ABI44_0_0RCTCGRectFromRect(layoutMetrics.getContentFrame())];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _stateTeller.invalidate();
  _textInput = nil;
}

@end

Class<ABI44_0_0RCTComponentViewProtocol> ABI44_0_0RCTInputAccessoryCls(void)
{
  return ABI44_0_0RCTInputAccessoryComponentView.class;
}
