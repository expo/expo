/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTTextField.h"

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTFont.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUtils.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>

#import "ABI24_0_0RCTBackedTextInputDelegate.h"
#import "ABI24_0_0RCTTextSelection.h"
#import "ABI24_0_0RCTUITextField.h"

@interface ABI24_0_0RCTTextField () <ABI24_0_0RCTBackedTextInputDelegate>

@end

@implementation ABI24_0_0RCTTextField
{
  ABI24_0_0RCTUITextField *_backedTextInput;
  BOOL _submitted;
  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(ABI24_0_0RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    _blurOnSubmit = YES;

    _backedTextInput = [[ABI24_0_0RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInput.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInput.textInputDelegate = self;
    _backedTextInput.font = self.fontAttributes.font;

    [self addSubview:_backedTextInput];
  }

  return self;
}

ABI24_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI24_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (id<ABI24_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInput;
}

- (void)sendKeyValueForString:(NSString *)string
{
  [_eventDispatcher sendTextEventWithType:ABI24_0_0RCTTextEventTypeKeyPress
                                 ReactABI24_0_0Tag:self.ReactABI24_0_0Tag
                                     text:nil
                                      key:string
                               eventCount:_nativeEventCount];
}

#pragma mark - Properties

- (NSString *)text
{
  return _backedTextInput.text;
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:self.text]) {
    UITextRange *selection = _backedTextInput.selectedTextRange;
    NSInteger oldTextLength = _backedTextInput.text.length;

    _backedTextInput.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger offsetStart = [_backedTextInput offsetFromPosition:_backedTextInput.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument offset:newOffset];
      [_backedTextInput setSelectedTextRange:[_backedTextInput textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];
    }
  } else if (eventLag > ABI24_0_0RCTTextUpdateLagWarningThreshold) {
    ABI24_0_0RCTLogWarn(@"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.", _backedTextInput.text, (long long)eventLag);
  }
}

#pragma mark - ABI24_0_0RCTBackedTextInputDelegate

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)string
{
  // Only allow single keypresses for `onKeyPress`, pasted text will not be sent.
  if (!_backedTextInput.textWasPasted) {
    [self sendKeyValueForString:string];
  }

  if (_maxLength != nil && ![string isEqualToString:@"\n"]) { // Make sure forms can be submitted via return.
    NSUInteger allowedLength = _maxLength.integerValue - MIN(_maxLength.integerValue, _backedTextInput.text.length) + range.length;
    if (string.length > allowedLength) {
      if (string.length > 1) {
        // Truncate the input string so the result is exactly `maxLength`.
        NSString *limitedString = [string substringToIndex:allowedLength];
        NSMutableString *newString = _backedTextInput.text.mutableCopy;
        [newString replaceCharactersInRange:range withString:limitedString];
        _backedTextInput.text = newString;

        // Collapse selection at end of insert to match normal paste behavior.
        UITextPosition *insertEnd = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument
                                                              offset:(range.location + allowedLength)];
        [_backedTextInput setSelectedTextRange:[_backedTextInput textRangeFromPosition:insertEnd toPosition:insertEnd]
                                notifyDelegate:YES];
        [self textInputDidChange];
      }
      return NO;
    }
  }

  return YES;
}

- (void)textInputDidChange
{
  _nativeEventCount++;
  [_eventDispatcher sendTextEventWithType:ABI24_0_0RCTTextEventTypeChange
                                 ReactABI24_0_0Tag:self.ReactABI24_0_0Tag
                                     text:_backedTextInput.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

@end
