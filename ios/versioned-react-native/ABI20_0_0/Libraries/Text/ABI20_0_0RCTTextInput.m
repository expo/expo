/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTTextInput.h"

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>

@implementation ABI20_0_0RCTTextInput {
  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(ABI20_0_0RCTBridge *)bridge
{
  ABI20_0_0RCTAssertParam(bridge);

  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
  }

  return self;
}

ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)decoder)
ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

- (id<ABI20_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  ABI20_0_0RCTAssert(NO, @"-[ABI20_0_0RCTTextInput backedTextInputView] must be implemented in subclass.");
  return nil;
}

#pragma mark - Properties

- (void)setReactABI20_0_0PaddingInsets:(UIEdgeInsets)ReactABI20_0_0PaddingInsets
{
  _ReactABI20_0_0PaddingInsets = ReactABI20_0_0PaddingInsets;
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInset`.
  self.backedTextInputView.textContainerInset = ReactABI20_0_0PaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactABI20_0_0BorderInsets:(UIEdgeInsets)ReactABI20_0_0BorderInsets
{
  _ReactABI20_0_0BorderInsets = ReactABI20_0_0BorderInsets;
  // We apply `borderInsets` as `backedTextInputView` layout offset.
  self.backedTextInputView.frame = UIEdgeInsetsInsetRect(self.bounds, ReactABI20_0_0BorderInsets);
  [self setNeedsLayout];
}

#pragma mark - Content Size (in Yoga terms, without any insets)

- (CGSize)contentSize
{
  CGSize contentSize = self.intrinsicContentSize;
  UIEdgeInsets compoundInsets = self.ReactABI20_0_0CompoundInsets;
  contentSize.width -= compoundInsets.left + compoundInsets.right;
  contentSize.height -= compoundInsets.top + compoundInsets.bottom;
  // Returning value does NOT include border and padding insets.
  return contentSize;
}

- (void)invalidateContentSize
{
  // Updates `contentSize` property and notifies Yoga about the change, if necessary.
  CGSize contentSize = self.contentSize;

  if (CGSizeEqualToSize(_previousContentSize, contentSize)) {
    return;
  }
  _previousContentSize = contentSize;

  [_bridge.uiManager setIntrinsicContentSize:contentSize forView:self];

  if (_onContentSizeChange) {
    _onContentSizeChange(@{
      @"contentSize": @{
        @"height": @(contentSize.height),
        @"width": @(contentSize.width),
      },
      @"target": self.ReactABI20_0_0Tag,
    });
  }
}

#pragma mark - Layout (in UIKit terms, with all insets)

- (CGSize)intrinsicContentSize
{
  CGSize size = self.backedTextInputView.intrinsicContentSize;
  size.width += _ReactABI20_0_0BorderInsets.left + _ReactABI20_0_0BorderInsets.right;
  size.height += _ReactABI20_0_0BorderInsets.top + _ReactABI20_0_0BorderInsets.bottom;
  // Returning value DOES include border and padding insets.
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGFloat compoundHorizontalBorderInset = _ReactABI20_0_0BorderInsets.left + _ReactABI20_0_0BorderInsets.right;
  CGFloat compoundVerticalBorderInset = _ReactABI20_0_0BorderInsets.top + _ReactABI20_0_0BorderInsets.bottom;

  size.width -= compoundHorizontalBorderInset;
  size.height -= compoundVerticalBorderInset;

  // Note: `paddingInsets` was already included in `backedTextInputView` size
  // because it was applied as `textContainerInset`.
  CGSize fittingSize = [self.backedTextInputView sizeThatFits:size];

  fittingSize.width += compoundHorizontalBorderInset;
  fittingSize.height += compoundVerticalBorderInset;

  // Returning value DOES include border and padding insets.
  return fittingSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self invalidateContentSize];
}

#pragma mark - Accessibility

- (UIView *)ReactABI20_0_0AccessibleView
{
  return self.backedTextInputView;
}

#pragma mark - Focus Control

- (void)ReactABI20_0_0Focus
{
  [self.backedTextInputView ReactABI20_0_0Focus];
}

- (void)ReactABI20_0_0Blur
{
  [self.backedTextInputView ReactABI20_0_0Blur];
}

- (void)didMoveToWindow
{
  [self.backedTextInputView ReactABI20_0_0FocusIfNeeded];
}

#pragma mark - Custom Input Accessory View

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [self invalidateInputAccessoryView];
}

- (void)invalidateInputAccessoryView
{
#if !TARGET_OS_TV
  UIView<ABI20_0_0RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  UIKeyboardType keyboardType = textInputView.keyboardType;

  // These keyboard types (all are number pads) don't have a "Done" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccesoryView =
    (
      keyboardType == UIKeyboardTypeNumberPad ||
      keyboardType == UIKeyboardTypePhonePad ||
      keyboardType == UIKeyboardTypeDecimalPad ||
      keyboardType == UIKeyboardTypeASCIICapableNumberPad
    ) &&
    textInputView.returnKeyType == UIReturnKeyDone;

  BOOL hasInputAccesoryView = textInputView.inputAccessoryView != nil;

  if (hasInputAccesoryView == shouldHaveInputAccesoryView) {
    return;
  }

  if (shouldHaveInputAccesoryView) {
    UIToolbar *toolbarView = [[UIToolbar alloc] init];
    [toolbarView sizeToFit];
    UIBarButtonItem *flexibleSpace =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace
                                                    target:nil
                                                    action:nil];
    UIBarButtonItem *doneButton =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                    target:self
                                                    action:@selector(handleInputAccessoryDoneButton)];
    toolbarView.items = @[flexibleSpace, doneButton];
    textInputView.inputAccessoryView = toolbarView;
  }
  else {
    textInputView.inputAccessoryView = nil;
  }

  // We have to call `reloadInputViews` for focused text inputs to update an accessory view.
  if (textInputView.isFirstResponder) {
    [textInputView reloadInputViews];
  }
#endif
}

- (void)handleInputAccessoryDoneButton
{
  [self.backedTextInputView endEditing:YES];
}

@end
