/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0RCTTextInput.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUtils.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>

#import "ABI21_0_0RCTTextSelection.h"

@implementation ABI21_0_0RCTTextInput {
  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(ABI21_0_0RCTBridge *)bridge
{
  ABI21_0_0RCTAssertParam(bridge);

  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
  }

  return self;
}

ABI21_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
ABI21_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)decoder)
ABI21_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

- (id<ABI21_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  ABI21_0_0RCTAssert(NO, @"-[ABI21_0_0RCTTextInput backedTextInputView] must be implemented in subclass.");
  return nil;
}

#pragma mark - Properties

- (void)setReactABI21_0_0PaddingInsets:(UIEdgeInsets)ReactABI21_0_0PaddingInsets
{
  _ReactABI21_0_0PaddingInsets = ReactABI21_0_0PaddingInsets;
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInset`.
  self.backedTextInputView.textContainerInset = ReactABI21_0_0PaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactABI21_0_0BorderInsets:(UIEdgeInsets)ReactABI21_0_0BorderInsets
{
  _ReactABI21_0_0BorderInsets = ReactABI21_0_0BorderInsets;
  // We apply `borderInsets` as `backedTextInputView` layout offset.
  self.backedTextInputView.frame = UIEdgeInsetsInsetRect(self.bounds, ReactABI21_0_0BorderInsets);
  [self setNeedsLayout];
}

- (ABI21_0_0RCTTextSelection *)selection
{
  id<ABI21_0_0RCTBackedTextInputViewProtocol> backedTextInput = self.backedTextInputView;
  UITextRange *selectedTextRange = backedTextInput.selectedTextRange;
  return [[ABI21_0_0RCTTextSelection new] initWithStart:[backedTextInput offsetFromPosition:backedTextInput.beginningOfDocument toPosition:selectedTextRange.start]
                                           end:[backedTextInput offsetFromPosition:backedTextInput.beginningOfDocument toPosition:selectedTextRange.end]];
}

- (void)setSelection:(ABI21_0_0RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  id<ABI21_0_0RCTBackedTextInputViewProtocol> backedTextInput = self.backedTextInputView;

  UITextRange *previousSelectedTextRange = backedTextInput.selectedTextRange;
  UITextPosition *start = [backedTextInput positionFromPosition:backedTextInput.beginningOfDocument offset:selection.start];
  UITextPosition *end = [backedTextInput positionFromPosition:backedTextInput.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [backedTextInput textRangeFromPosition:start toPosition:end];

  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![previousSelectedTextRange isEqual:selectedTextRange]) {
    [backedTextInput setSelectedTextRange:selectedTextRange notifyDelegate:NO];
  } else if (eventLag > ABI21_0_0RCTTextUpdateLagWarningThreshold) {
    ABI21_0_0RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", backedTextInput.text, eventLag);
  }
}

#pragma mark - ABI21_0_0RCTBackedTextInputDelegate

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  if (_clearTextOnFocus) {
    self.backedTextInputView.text = @"";
  }

  if (_selectTextOnFocus) {
    [self.backedTextInputView selectAll:nil];
  }

  [_eventDispatcher sendTextEventWithType:ABI21_0_0RCTTextEventTypeFocus
                                 ReactABI21_0_0Tag:self.ReactABI21_0_0Tag
                                     text:self.backedTextInputView.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (BOOL)textInputShouldReturn
{
  return _blurOnSubmit;
}

- (void)textInputDidReturn
{
  [_eventDispatcher sendTextEventWithType:ABI21_0_0RCTTextEventTypeSubmit
                                 ReactABI21_0_0Tag:self.ReactABI21_0_0Tag
                                     text:self.backedTextInputView.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textInputDidChangeSelection
{
  if (!_onSelectionChange) {
    return;
  }

  ABI21_0_0RCTTextSelection *selection = self.selection;
  _onSelectionChange(@{
    @"selection": @{
      @"start": @(selection.start),
      @"end": @(selection.end),
    },
  });
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
  [_eventDispatcher sendTextEventWithType:ABI21_0_0RCTTextEventTypeEnd
                                 ReactABI21_0_0Tag:self.ReactABI21_0_0Tag
                                     text:self.backedTextInputView.text
                                      key:nil
                               eventCount:_nativeEventCount];

  [_eventDispatcher sendTextEventWithType:ABI21_0_0RCTTextEventTypeBlur
                                 ReactABI21_0_0Tag:self.ReactABI21_0_0Tag
                                     text:self.backedTextInputView.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

#pragma mark - Content Size (in Yoga terms, without any insets)

- (CGSize)contentSize
{
  CGSize contentSize = self.backedTextInputView.contentSize;
  UIEdgeInsets ReactABI21_0_0PaddingInsets = self.ReactABI21_0_0PaddingInsets;
  contentSize.width -= ReactABI21_0_0PaddingInsets.left + ReactABI21_0_0PaddingInsets.right;
  contentSize.height -= ReactABI21_0_0PaddingInsets.top + ReactABI21_0_0PaddingInsets.bottom;
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
      @"target": self.ReactABI21_0_0Tag,
    });
  }
}

#pragma mark - Layout (in UIKit terms, with all insets)

- (CGSize)intrinsicContentSize
{
  CGSize size = self.backedTextInputView.intrinsicContentSize;
  size.width += _ReactABI21_0_0BorderInsets.left + _ReactABI21_0_0BorderInsets.right;
  size.height += _ReactABI21_0_0BorderInsets.top + _ReactABI21_0_0BorderInsets.bottom;
  // Returning value DOES include border and padding insets.
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGFloat compoundHorizontalBorderInset = _ReactABI21_0_0BorderInsets.left + _ReactABI21_0_0BorderInsets.right;
  CGFloat compoundVerticalBorderInset = _ReactABI21_0_0BorderInsets.top + _ReactABI21_0_0BorderInsets.bottom;

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

- (UIView *)ReactABI21_0_0AccessibilityElement
{
  return self.backedTextInputView;
}

#pragma mark - Focus Control

- (void)ReactABI21_0_0Focus
{
  [self.backedTextInputView ReactABI21_0_0Focus];
}

- (void)ReactABI21_0_0Blur
{
  [self.backedTextInputView ReactABI21_0_0Blur];
}

- (void)didMoveToWindow
{
  [self.backedTextInputView ReactABI21_0_0FocusIfNeeded];
}

#pragma mark - Custom Input Accessory View

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [self invalidateInputAccessoryView];
}

- (void)invalidateInputAccessoryView
{
#if !TARGET_OS_TV
  UIView<ABI21_0_0RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
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
