/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTTextField.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTEventDispatcher.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUIManager.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>

#import "ABI19_0_0RCTTextSelection.h"
#import "ABI19_0_0RCTUITextField.h"

@interface ABI19_0_0RCTTextField () <UITextFieldDelegate>

@end

@implementation ABI19_0_0RCTTextField
{
  ABI19_0_0RCTBridge *_bridge;
  ABI19_0_0RCTEventDispatcher *_eventDispatcher;
  NSInteger _nativeEventCount;
  BOOL _submitted;
  UITextRange *_previousSelectionRange;
  NSString *_finalText;
  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(ABI19_0_0RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    ABI19_0_0RCTAssertParam(bridge);

    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;

    _textField = [[ABI19_0_0RCTUITextField alloc] initWithFrame:self.bounds];
    _textField.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    // Note: `UITextField` fires same events to channels in this order: delegate method, notification center, target action.
    // Usually (presumably) all events with equivalent semantic fires consistently in specified order...
    // but in practice, it is not always true, unfortunately.
    // Surprisingly, seems subscribing via Notification Center is the most reliable way to get these events.

    _textField.delegate = self;

    [_textField addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [_textField addTarget:self action:@selector(textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [_textField addTarget:self action:@selector(textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [_textField addTarget:self action:@selector(textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];

    [_textField addObserver:self forKeyPath:@"selectedTextRange" options:0 context:nil];

    [self addSubview:_textField];
  }

  return self;
}

ABI19_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI19_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)dealloc
{
  [_textField removeObserver:self forKeyPath:@"selectedTextRange"];
}

- (void)sendKeyValueForString:(NSString *)string
{
  [_eventDispatcher sendTextEventWithType:ABI19_0_0RCTTextEventTypeKeyPress
                                 ReactABI19_0_0Tag:self.ReactABI19_0_0Tag
                                     text:nil
                                      key:string
                               eventCount:_nativeEventCount];
}

#pragma mark - Properties

- (void)setReactABI19_0_0PaddingInsets:(UIEdgeInsets)ReactABI19_0_0PaddingInsets
{
  _ReactABI19_0_0PaddingInsets = ReactABI19_0_0PaddingInsets;
  // We apply `paddingInsets` as `_textField`'s `textContainerInset`.
  _textField.textContainerInset = ReactABI19_0_0PaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactABI19_0_0BorderInsets:(UIEdgeInsets)ReactABI19_0_0BorderInsets
{
  _ReactABI19_0_0BorderInsets = ReactABI19_0_0BorderInsets;
  // We apply `borderInsets` as `_textView` layout offset.
  _textField.frame = UIEdgeInsetsInsetRect(self.bounds, ReactABI19_0_0BorderInsets);
  [self setNeedsLayout];
}

- (void)setSelection:(ABI19_0_0RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  UITextRange *currentSelection = _textField.selectedTextRange;
  UITextPosition *start = [_textField positionFromPosition:_textField.beginningOfDocument offset:selection.start];
  UITextPosition *end = [_textField positionFromPosition:_textField.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [_textField textRangeFromPosition:start toPosition:end];

  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![currentSelection isEqual:selectedTextRange]) {
    _previousSelectionRange = selectedTextRange;
    _textField.selectedTextRange = selectedTextRange;
  } else if (eventLag > ABI19_0_0RCTTextUpdateLagWarningThreshold) {
    ABI19_0_0RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (NSString *)text
{
  return _textField.text;
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:self.text]) {
    UITextRange *selection = _textField.selectedTextRange;
    NSInteger oldTextLength = _textField.text.length;

    _textField.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger offsetStart = [_textField offsetFromPosition:_textField.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [_textField positionFromPosition:_textField.beginningOfDocument offset:newOffset];
      _textField.selectedTextRange = [_textField textRangeFromPosition:position toPosition:position];
    }
  } else if (eventLag > ABI19_0_0RCTTextUpdateLagWarningThreshold) {
    ABI19_0_0RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", _textField.text, eventLag);
  }
}

#pragma mark - Events

- (void)textFieldDidChange
{
  _nativeEventCount++;
  [_eventDispatcher sendTextEventWithType:ABI19_0_0RCTTextEventTypeChange
                                 ReactABI19_0_0Tag:self.ReactABI19_0_0Tag
                                     text:_textField.text
                                      key:nil
                               eventCount:_nativeEventCount];

  // selectedTextRange observer isn't triggered when you type even though the
  // cursor position moves, so we send event again here.
  [self sendSelectionEvent];
}

- (void)textFieldEndEditing
{
  if (![_finalText isEqualToString:_textField.text]) {
    _finalText = nil;
    // iOS does't send event `UIControlEventEditingChanged` if the change was happened because of autocorrection
    // which was triggered by loosing focus. We assume that if `text` was changed in the middle of loosing focus process,
    // we did not receive that event. So, we call `textFieldDidChange` manually.
    [self textFieldDidChange];
  }

  [_eventDispatcher sendTextEventWithType:ABI19_0_0RCTTextEventTypeEnd
                                 ReactABI19_0_0Tag:self.ReactABI19_0_0Tag
                                     text:_textField.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textFieldSubmitEditing
{
  _submitted = YES;
  [_eventDispatcher sendTextEventWithType:ABI19_0_0RCTTextEventTypeSubmit
                                 ReactABI19_0_0Tag:self.ReactABI19_0_0Tag
                                     text:_textField.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textFieldBeginEditing
{
  [_eventDispatcher sendTextEventWithType:ABI19_0_0RCTTextEventTypeFocus
                                 ReactABI19_0_0Tag:self.ReactABI19_0_0Tag
                                     text:_textField.text
                                      key:nil
                               eventCount:_nativeEventCount];

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_selectTextOnFocus) {
      [self->_textField selectAll:nil];
    }

    [self sendSelectionEvent];
  });
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(__unused UITextField *)textField
                        change:(__unused NSDictionary *)change
                       context:(__unused void *)context
{
  if ([keyPath isEqualToString:@"selectedTextRange"]) {
    [self sendSelectionEvent];
  }
}

- (void)sendSelectionEvent
{
  if (_onSelectionChange &&
      _textField.selectedTextRange != _previousSelectionRange &&
      ![_textField.selectedTextRange isEqual:_previousSelectionRange]) {

    _previousSelectionRange = _textField.selectedTextRange;

    UITextRange *selection = _textField.selectedTextRange;
    NSInteger start = [_textField offsetFromPosition:[_textField beginningOfDocument] toPosition:selection.start];
    NSInteger end = [_textField offsetFromPosition:[_textField beginningOfDocument] toPosition:selection.end];
    _onSelectionChange(@{
      @"selection": @{
        @"start": @(start),
        @"end": @(end),
      },
    });
  }
}

#pragma mark - Content Size (in Yoga terms, without any insets)

- (CGSize)contentSize
{
  // Returning value does NOT include border and padding insets.
  CGSize contentSize = self.intrinsicContentSize;
  UIEdgeInsets compoundInsets = self.ReactABI19_0_0CompoundInsets;
  contentSize.width -= compoundInsets.left + compoundInsets.right;
  contentSize.height -= compoundInsets.top + compoundInsets.bottom;
  return contentSize;
}

- (void)invalidateContentSize
{
  CGSize contentSize = self.contentSize;

  if (CGSizeEqualToSize(_previousContentSize, contentSize)) {
    return;
  }
  _previousContentSize = contentSize;

  [_bridge.uiManager setIntrinsicContentSize:contentSize forView:self];
}

#pragma mark - Layout (in UIKit terms, with all insets)

- (CGSize)intrinsicContentSize
{
  // Returning value DOES include border and padding insets.
  CGSize size = _textField.intrinsicContentSize;
  size.width += _ReactABI19_0_0BorderInsets.left + _ReactABI19_0_0BorderInsets.right;
  size.height += _ReactABI19_0_0BorderInsets.top + _ReactABI19_0_0BorderInsets.bottom;
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGFloat compoundHorizontalBorderInset = _ReactABI19_0_0BorderInsets.left + _ReactABI19_0_0BorderInsets.right;
  CGFloat compoundVerticalBorderInset = _ReactABI19_0_0BorderInsets.top + _ReactABI19_0_0BorderInsets.bottom;

  size.width -= compoundHorizontalBorderInset;
  size.height -= compoundVerticalBorderInset;

  // Note: `paddingInsets` already included in `_textView` size
  // because it was applied as `textContainerInset`.
  CGSize fittingSize = [_textField sizeThatFits:size];

  fittingSize.width += compoundHorizontalBorderInset;
  fittingSize.height += compoundVerticalBorderInset;

  return fittingSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self invalidateContentSize];
}

#pragma mark - UITextFieldDelegate

- (BOOL)textField:(ABI19_0_0RCTTextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  // Only allow single keypresses for `onKeyPress`, pasted text will not be sent.
  if (!_textField.textWasPasted) {
    [self sendKeyValueForString:string];
  }

  if (_maxLength != nil && ![string isEqualToString:@"\n"]) { // Make sure forms can be submitted via return.
    NSUInteger allowedLength = _maxLength.integerValue - MIN(_maxLength.integerValue, _textField.text.length) + range.length;
    if (string.length > allowedLength) {
      if (string.length > 1) {
        // Truncate the input string so the result is exactly `maxLength`.
        NSString *limitedString = [string substringToIndex:allowedLength];
        NSMutableString *newString = _textField.text.mutableCopy;
        [newString replaceCharactersInRange:range withString:limitedString];
        _textField.text = newString;

        // Collapse selection at end of insert to match normal paste behavior.
        UITextPosition *insertEnd = [_textField positionFromPosition:_textField.beginningOfDocument
                                                              offset:(range.location + allowedLength)];
        _textField.selectedTextRange = [_textField textRangeFromPosition:insertEnd toPosition:insertEnd];
        [self textFieldDidChange];
      }
      return NO;
    }
  }

  return YES;
}

// This method allows us to detect a `Backspace` keyPress
// even when there is no more text in the TextField.
- (BOOL)keyboardInputShouldDelete:(ABI19_0_0RCTTextField *)textField
{
  [self textField:_textField shouldChangeCharactersInRange:NSMakeRange(0, 0) replacementString:@""];
  return YES;
}

- (BOOL)textFieldShouldEndEditing:(ABI19_0_0RCTTextField *)textField
{
  _finalText = _textField.text;

  if (_submitted) {
    _submitted = NO;
    return _blurOnSubmit;
  }

  return YES;
}

- (void)textFieldDidEndEditing:(UITextField *)textField
{
  [_eventDispatcher sendTextEventWithType:ABI19_0_0RCTTextEventTypeBlur
                                 ReactABI19_0_0Tag:self.ReactABI19_0_0Tag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

#pragma mark - Accessibility

- (UIView *)ReactABI19_0_0AccessibilityElement
{
  return _textField;
}

#pragma mark - Focus control deledation

- (void)ReactABI19_0_0Focus
{
  [_textField ReactABI19_0_0Focus];
}

- (void)ReactABI19_0_0Blur
{
  [_textField ReactABI19_0_0Blur];
}

- (void)didMoveToWindow
{
  [_textField ReactABI19_0_0FocusIfNeeded];
}

@end
