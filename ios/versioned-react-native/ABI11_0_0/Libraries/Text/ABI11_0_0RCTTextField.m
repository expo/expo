/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTTextField.h"

#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTEventDispatcher.h"
#import "ABI11_0_0RCTUtils.h"
#import "ABI11_0_0RCTTextSelection.h"
#import "UIView+ReactABI11_0_0.h"

@implementation ABI11_0_0RCTTextField
{
  ABI11_0_0RCTEventDispatcher *_eventDispatcher;
  BOOL _jsRequestingFirstResponder;
  NSInteger _nativeEventCount;
  BOOL _submitted;
  UITextRange *_previousSelectionRange;
}

- (instancetype)initWithEventDispatcher:(ABI11_0_0RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    ABI11_0_0RCTAssert(eventDispatcher, @"eventDispatcher is a required parameter");
    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [self addTarget:self action:@selector(textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    [self addObserver:self forKeyPath:@"selectedTextRange" options:0 context:nil];
    _blurOnSubmit = YES;
  }
  return self;
}

- (void)dealloc
{
  [self removeObserver:self forKeyPath:@"selectedTextRange"];
}

ABI11_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI11_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)sendKeyValueForString:(NSString *)string
{
  [_eventDispatcher sendTextEventWithType:ABI11_0_0RCTTextEventTypeKeyPress
                                 ReactABI11_0_0Tag:self.ReactABI11_0_0Tag
                                     text:nil
                                      key:string
                               eventCount:_nativeEventCount];
}

// This method is overridden for `onKeyPress`. The manager
// will not send a keyPress for text that was pasted.
- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}

- (void)setSelection:(ABI11_0_0RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  UITextRange *currentSelection = self.selectedTextRange;
  UITextPosition *start = [self positionFromPosition:self.beginningOfDocument offset:selection.start];
  UITextPosition *end = [self positionFromPosition:self.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [self textRangeFromPosition:start toPosition:end];

  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![currentSelection isEqual:selectedTextRange]) {
    _previousSelectionRange = selectedTextRange;
    self.selectedTextRange = selectedTextRange;
  } else if (eventLag > ABI11_0_0RCTTextUpdateLagWarningThreshold) {
    ABI11_0_0RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:self.text]) {
    UITextRange *selection = self.selectedTextRange;
    NSInteger oldTextLength = self.text.length;

    super.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger offsetStart = [self offsetFromPosition:self.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [self positionFromPosition:self.beginningOfDocument offset:newOffset];
      self.selectedTextRange = [self textRangeFromPosition:position toPosition:position];
    }
  } else if (eventLag > ABI11_0_0RCTTextUpdateLagWarningThreshold) {
    ABI11_0_0RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

static void ABI11_0_0RCTUpdatePlaceholder(ABI11_0_0RCTTextField *self)
{
  if (self.placeholder.length > 0 && self.placeholderTextColor) {
    self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder
                                                                 attributes:@{
                                                                              NSForegroundColorAttributeName : self.placeholderTextColor
                                                                              }];
  } else if (self.placeholder.length) {
    self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder];
  }
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  _placeholderTextColor = placeholderTextColor;
  ABI11_0_0RCTUpdatePlaceholder(self);
}

- (void)setPlaceholder:(NSString *)placeholder
{
  super.placeholder = placeholder;
  ABI11_0_0RCTUpdatePlaceholder(self);
}

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }
  return [super caretRectForPosition:position];
}

- (CGRect)textRectForBounds:(CGRect)bounds
{
  CGRect rect = [super textRectForBounds:bounds];
  return UIEdgeInsetsInsetRect(rect, _contentInset);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  self.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return self.autocorrectionType == UITextAutocorrectionTypeYes;
}

- (void)textFieldDidChange
{
  _nativeEventCount++;
  [_eventDispatcher sendTextEventWithType:ABI11_0_0RCTTextEventTypeChange
                                 ReactABI11_0_0Tag:self.ReactABI11_0_0Tag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];

  // selectedTextRange observer isn't triggered when you type even though the
  // cursor position moves, so we send event again here.
  [self sendSelectionEvent];
}

- (void)textFieldEndEditing
{
  [_eventDispatcher sendTextEventWithType:ABI11_0_0RCTTextEventTypeEnd
                                 ReactABI11_0_0Tag:self.ReactABI11_0_0Tag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];
}
- (void)textFieldSubmitEditing
{
  _submitted = YES;
  [_eventDispatcher sendTextEventWithType:ABI11_0_0RCTTextEventTypeSubmit
                                 ReactABI11_0_0Tag:self.ReactABI11_0_0Tag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textFieldBeginEditing
{
  [_eventDispatcher sendTextEventWithType:ABI11_0_0RCTTextEventTypeFocus
                                 ReactABI11_0_0Tag:self.ReactABI11_0_0Tag
                                     text:self.text
                                      key:nil
                               eventCount:_nativeEventCount];

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_selectTextOnFocus) {
      [self selectAll:nil];
    }

    [self sendSelectionEvent];
  });
}

- (BOOL)textFieldShouldEndEditing:(ABI11_0_0RCTTextField *)textField
{
  if (_submitted) {
    _submitted = NO;
    return _blurOnSubmit;
  }
  return YES;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(ABI11_0_0RCTTextField *)textField
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if ([keyPath isEqualToString:@"selectedTextRange"]) {
    [self sendSelectionEvent];
  }
}

- (void)sendSelectionEvent
{
  if (_onSelectionChange &&
      self.selectedTextRange != _previousSelectionRange &&
      ![self.selectedTextRange isEqual:_previousSelectionRange]) {

    _previousSelectionRange = self.selectedTextRange;

    UITextRange *selection = self.selectedTextRange;
    NSInteger start = [self offsetFromPosition:[self beginningOfDocument] toPosition:selection.start];
    NSInteger end = [self offsetFromPosition:[self beginningOfDocument] toPosition:selection.end];
    _onSelectionChange(@{
      @"selection": @{
        @"start": @(start),
        @"end": @(end),
      },
    });
  }
}

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (void)ReactABI11_0_0WillMakeFirstResponder
{
  _jsRequestingFirstResponder = YES;
}

- (void)ReactABI11_0_0DidMakeFirstResponder
{
  _jsRequestingFirstResponder = NO;
}

- (BOOL)resignFirstResponder
{
  BOOL result = [super resignFirstResponder];
  if (result)
  {
    [_eventDispatcher sendTextEventWithType:ABI11_0_0RCTTextEventTypeBlur
                                   ReactABI11_0_0Tag:self.ReactABI11_0_0Tag
                                       text:self.text
                                        key:nil
                                 eventCount:_nativeEventCount];
  }
  return result;
}

@end
