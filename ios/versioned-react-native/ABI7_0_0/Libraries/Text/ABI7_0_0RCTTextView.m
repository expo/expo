/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTTextView.h"

#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTEventDispatcher.h"
#import "ABI7_0_0RCTShadowText.h"
#import "ABI7_0_0RCTText.h"
#import "ABI7_0_0RCTUtils.h"
#import "UIView+ReactABI7_0_0.h"

@interface ABI7_0_0RCTUITextView : UITextView

@property (nonatomic, assign) BOOL textWasPasted;

@end

@implementation ABI7_0_0RCTUITextView
{
  BOOL _jsRequestingFirstResponder;
}

- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}

- (void)ReactABI7_0_0WillMakeFirstResponder
{
  _jsRequestingFirstResponder = YES;
}

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (void)ReactABI7_0_0DidMakeFirstResponder
{
  _jsRequestingFirstResponder = NO;
}

@end

@implementation ABI7_0_0RCTTextView
{
  ABI7_0_0RCTEventDispatcher *_eventDispatcher;
  NSString *_placeholder;
  UITextView *_placeholderView;
  UITextView *_textView;
  NSInteger _nativeEventCount;
  ABI7_0_0RCTText *_richTextView;
  NSAttributedString *_pendingAttributedText;
  NSMutableArray<UIView *> *_subviews;
  BOOL _blockTextShouldChange;
  UITextRange *_previousSelectionRange;
  NSUInteger _previousTextLength;
  CGFloat _previousContentHeight;
  UIScrollView *_scrollView;
}

- (instancetype)initWithEventDispatcher:(ABI7_0_0RCTEventDispatcher *)eventDispatcher
{
  ABI7_0_0RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    _contentInset = UIEdgeInsetsZero;
    _eventDispatcher = eventDispatcher;
    _placeholderTextColor = [self defaultPlaceholderTextColor];
    _blurOnSubmit = NO;

    _textView = [[ABI7_0_0RCTUITextView alloc] initWithFrame:CGRectZero];
    _textView.backgroundColor = [UIColor clearColor];
    _textView.scrollsToTop = NO;
    _textView.scrollEnabled = NO;
    _textView.delegate = self;

    _scrollView = [[UIScrollView alloc] initWithFrame:CGRectZero];
    _scrollView.scrollsToTop = NO;
    [_scrollView addSubview:_textView];

    _previousSelectionRange = _textView.selectedTextRange;

    _subviews = [NSMutableArray new];
    [self addSubview:_scrollView];
  }
  return self;
}

ABI7_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI7_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (NSArray<UIView *> *)ReactABI7_0_0Subviews
{
  return _subviews;
}

- (void)insertReactABI7_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  if ([subview isKindOfClass:[ABI7_0_0RCTText class]]) {
    if (_richTextView) {
      ABI7_0_0RCTLogError(@"Tried to insert a second <Text> into <TextInput> - there can only be one.");
    }
    _richTextView = (ABI7_0_0RCTText *)subview;
    [_subviews insertObject:_richTextView atIndex:index];

    // If this <TextInput> is in rich text editing mode, and the child <Text> node providing rich text
    // styling has a backgroundColor, then the attributedText produced by the child <Text> node will have an
    // NSBackgroundColor attribute. We need to forward this attribute to the text view manually because the text view
    // always has a clear background color in -initWithEventDispatcher:.
    //
    // TODO: This should be removed when the related hack in -performPendingTextUpdate is removed.
    if (subview.backgroundColor) {
      NSMutableDictionary<NSString *, id> *attrs = [_textView.typingAttributes mutableCopy];
      attrs[NSBackgroundColorAttributeName] = subview.backgroundColor;
      _textView.typingAttributes = attrs;
    }
  } else {
    [_subviews insertObject:subview atIndex:index];
    [self insertSubview:subview atIndex:index];
  }
}

- (void)removeReactABI7_0_0Subview:(UIView *)subview
{
  if (_richTextView == subview) {
    [_subviews removeObject:_richTextView];
    _richTextView = nil;
  } else {
    [_subviews removeObject:subview];
    [subview removeFromSuperview];
  }
}

- (void)setMostRecentEventCount:(NSInteger)mostRecentEventCount
{
  _mostRecentEventCount = mostRecentEventCount;

  // Props are set after uiBlockToAmendWithShadowViewRegistry, which means that
  // at the time performTextUpdate is called, _mostRecentEventCount will be
  // behind _eventCount, with the result that performPendingTextUpdate will do
  // nothing. For that reason we call it again here after mostRecentEventCount
  // has been set.
  [self performPendingTextUpdate];
}

- (void)performTextUpdate
{
  if (_richTextView) {
    _pendingAttributedText = _richTextView.textStorage;
    [self performPendingTextUpdate];
  } else if (!self.text) {
    _textView.attributedText = nil;
  }
}

static NSAttributedString *removeReactABI7_0_0TagFromString(NSAttributedString *string)
{
  if (string.length == 0) {
    return string;
  } else {
    NSMutableAttributedString *mutableString = [[NSMutableAttributedString alloc] initWithAttributedString:string];
    [mutableString removeAttribute:ABI7_0_0RCTReactABI7_0_0TagAttributeName range:NSMakeRange(0, mutableString.length)];
    return mutableString;
  }
}

- (void)performPendingTextUpdate
{
  if (!_pendingAttributedText || _mostRecentEventCount < _nativeEventCount) {
    return;
  }

  // The underlying <Text> node that produces _pendingAttributedText has a ReactABI7_0_0 tag attribute on it that causes the
  // -isEqualToAttributedString: comparison below to spuriously fail. We don't want that comparison to fail unless it
  // needs to because when the comparison fails, we end up setting attributedText on the text view, which clears
  // autocomplete state for CKJ text input.
  //
  // TODO: Kill this after we finish passing all style/attribute info into JS.
  _pendingAttributedText = removeReactABI7_0_0TagFromString(_pendingAttributedText);

  if ([_textView.attributedText isEqualToAttributedString:_pendingAttributedText]) {
    _pendingAttributedText = nil; // Don't try again.
    return;
  }

  // When we update the attributed text, there might be pending autocorrections
  // that will get accepted by default. In order for this to not garble our text,
  // we temporarily block all textShouldChange events so they are not applied.
  _blockTextShouldChange = YES;

  UITextRange *selection = _textView.selectedTextRange;
  NSInteger oldTextLength = _textView.attributedText.length;

  _textView.attributedText = _pendingAttributedText;
  _pendingAttributedText = nil;

  if (selection.empty) {
    // maintain cursor position relative to the end of the old text
    NSInteger start = [_textView offsetFromPosition:_textView.beginningOfDocument toPosition:selection.start];
    NSInteger offsetFromEnd = oldTextLength - start;
    NSInteger newOffset = _textView.attributedText.length - offsetFromEnd;
    UITextPosition *position = [_textView positionFromPosition:_textView.beginningOfDocument offset:newOffset];
    _textView.selectedTextRange = [_textView textRangeFromPosition:position toPosition:position];
  }

  [_textView layoutIfNeeded];

  [self _setPlaceholderVisibility];

  _blockTextShouldChange = NO;
}

- (void)updateFrames
{
  // Adjust the insets so that they are as close as possible to single-line
  // ABI7_0_0RCTTextField defaults, using the system defaults of font size 17 and a
  // height of 31 points.
  //
  // We apply the left inset to the frame since a negative left text-container
  // inset mysteriously causes the text to be hidden until the text view is
  // first focused.
  UIEdgeInsets adjustedFrameInset = UIEdgeInsetsZero;
  adjustedFrameInset.left = _contentInset.left - 5;

  UIEdgeInsets adjustedTextContainerInset = _contentInset;
  adjustedTextContainerInset.top += 5;
  adjustedTextContainerInset.left = 0;

  CGRect frame = UIEdgeInsetsInsetRect(self.bounds, adjustedFrameInset);
  _textView.frame = frame;
  _placeholderView.frame = frame;
  _scrollView.frame = frame;
  [self updateContentSize];

  _textView.textContainerInset = adjustedTextContainerInset;
  _placeholderView.textContainerInset = adjustedTextContainerInset;
}

- (void)updateContentSize
{
  CGSize size = (CGSize){_scrollView.frame.size.width, INFINITY};
  size.height = [_textView sizeThatFits:size].height;
  _scrollView.contentSize = size;
  _textView.frame = (CGRect){CGPointZero, size};
}

- (void)updatePlaceholder
{
  [_placeholderView removeFromSuperview];
  _placeholderView = nil;

  if (_placeholder) {
    _placeholderView = [[UITextView alloc] initWithFrame:self.bounds];
    _placeholderView.editable = NO;
    _placeholderView.userInteractionEnabled = NO;
    _placeholderView.backgroundColor = [UIColor clearColor];
    _placeholderView.scrollEnabled = false;
    _placeholderView.scrollsToTop = NO;
    _placeholderView.attributedText =
    [[NSAttributedString alloc] initWithString:_placeholder attributes:@{
      NSFontAttributeName : (_textView.font ? _textView.font : [self defaultPlaceholderFont]),
      NSForegroundColorAttributeName : _placeholderTextColor
    }];

    [self insertSubview:_placeholderView belowSubview:_textView];
    [self _setPlaceholderVisibility];
  }
}

- (UIFont *)font
{
  return _textView.font;
}

- (void)setFont:(UIFont *)font
{
  _textView.font = font;
  [self updatePlaceholder];
}

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
  [self updatePlaceholder];
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  if (placeholderTextColor) {
    _placeholderTextColor = placeholderTextColor;
  } else {
    _placeholderTextColor = [self defaultPlaceholderTextColor];
  }
  [self updatePlaceholder];
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [self updateFrames];
}

- (NSString *)text
{
  return _textView.text;
}

- (BOOL)textView:(ABI7_0_0RCTUITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  if (_blockTextShouldChange) {
    return NO;
  }

  if (textView.textWasPasted) {
    textView.textWasPasted = NO;
  } else {

    [_eventDispatcher sendTextEventWithType:ABI7_0_0RCTTextEventTypeKeyPress
                                   ReactABI7_0_0Tag:self.ReactABI7_0_0Tag
                                       text:nil
                                        key:text
                                 eventCount:_nativeEventCount];

    if (_blurOnSubmit && [text isEqualToString:@"\n"]) {

      // TODO: the purpose of blurOnSubmit on ABI7_0_0RCTextField is to decide if the
      // field should lose focus when return is pressed or not. We're cheating a
      // bit here by using it on ABI7_0_0RCTextView to decide if return character should
      // submit the form, or be entered into the field.
      //
      // The reason this is cheating is because there's no way to specify that
      // you want the return key to be swallowed *and* have the field retain
      // focus (which was what blurOnSubmit was originally for). For the case
      // where _blurOnSubmit = YES, this is still the correct and expected
      // behavior though, so we'll leave the don't-blur-or-add-newline problem
      // to be solved another day.

      [_eventDispatcher sendTextEventWithType:ABI7_0_0RCTTextEventTypeSubmit
                                     ReactABI7_0_0Tag:self.ReactABI7_0_0Tag
                                         text:self.text
                                          key:nil
                                   eventCount:_nativeEventCount];
      [self resignFirstResponder];
      return NO;
    }
  }

  if (_maxLength == nil) {
    return YES;
  }
  NSUInteger allowedLength = _maxLength.integerValue - textView.text.length + range.length;
  if (text.length > allowedLength) {
    if (text.length > 1) {
      // Truncate the input string so the result is exactly maxLength
      NSString *limitedString = [text substringToIndex:allowedLength];
      NSMutableString *newString = textView.text.mutableCopy;
      [newString replaceCharactersInRange:range withString:limitedString];
      textView.text = newString;
      // Collapse selection at end of insert to match normal paste behavior
      UITextPosition *insertEnd = [textView positionFromPosition:textView.beginningOfDocument
                                                          offset:(range.location + allowedLength)];
      textView.selectedTextRange = [textView textRangeFromPosition:insertEnd toPosition:insertEnd];
      [self textViewDidChange:textView];
    }
    return NO;
  } else {
    return YES;
  }
}

- (void)textViewDidChangeSelection:(ABI7_0_0RCTUITextView *)textView
{
  if (_onSelectionChange &&
      textView.selectedTextRange != _previousSelectionRange &&
      ![textView.selectedTextRange isEqual:_previousSelectionRange]) {

    _previousSelectionRange = textView.selectedTextRange;

    UITextRange *selection = textView.selectedTextRange;
    NSInteger start = [textView offsetFromPosition:textView.beginningOfDocument toPosition:selection.start];
    NSInteger end = [textView offsetFromPosition:textView.beginningOfDocument toPosition:selection.end];
    _onSelectionChange(@{
      @"selection": @{
        @"start": @(start),
        @"end": @(end),
      },
    });
  }
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:_textView.text]) {
    UITextRange *selection = _textView.selectedTextRange;
    NSInteger oldTextLength = _textView.text.length;

    _textView.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger start = [_textView offsetFromPosition:_textView.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - start;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [_textView positionFromPosition:_textView.beginningOfDocument offset:newOffset];
      _textView.selectedTextRange = [_textView textRangeFromPosition:position toPosition:position];
    }

    [self _setPlaceholderVisibility];
    [self updateContentSize]; //keep the text wrapping when the length of
    //the textline has been extended longer than the length of textinputView
  } else if (eventLag > ABI7_0_0RCTTextUpdateLagWarningThreshold) {
    ABI7_0_0RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (void)_setPlaceholderVisibility
{
  if (_textView.text.length > 0) {
    [_placeholderView setHidden:YES];
  } else {
    [_placeholderView setHidden:NO];
  }
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  _textView.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return _textView.autocorrectionType == UITextAutocorrectionTypeYes;
}

- (BOOL)textViewShouldBeginEditing:(UITextView *)textView
{
  if (_selectTextOnFocus) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [textView selectAll:nil];
    });
  }
  return YES;
}

- (void)textViewDidBeginEditing:(UITextView *)textView
{
  if (_clearTextOnFocus) {
    _textView.text = @"";
    [self _setPlaceholderVisibility];
  }

  [_eventDispatcher sendTextEventWithType:ABI7_0_0RCTTextEventTypeFocus
                                 ReactABI7_0_0Tag:self.ReactABI7_0_0Tag
                                     text:nil
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (void)textViewDidChange:(UITextView *)textView
{
  [self updateContentSize];
  [self _setPlaceholderVisibility];
  _nativeEventCount++;

  if (!self.ReactABI7_0_0Tag) {
    return;
  }

  // When the context size increases, iOS updates the contentSize twice; once
  // with a lower height, then again with the correct height. To prevent a
  // spurious event from being sent, we track the previous, and only send the
  // update event if it matches our expectation that greater text length
  // should result in increased height. This assumption is, of course, not
  // necessarily true because shorter text might include more linebreaks, but
  // in practice this works well enough.
  NSUInteger textLength = textView.text.length;
  CGFloat contentHeight = textView.contentSize.height;
  if (textLength >= _previousTextLength) {
    contentHeight = MAX(contentHeight, _previousContentHeight);
  }
  _previousTextLength = textLength;
  _previousContentHeight = contentHeight;

  NSDictionary *event = @{
    @"text": self.text,
    @"contentSize": @{
      @"height": @(contentHeight),
      @"width": @(textView.contentSize.width)
    },
    @"target": self.ReactABI7_0_0Tag,
    @"eventCount": @(_nativeEventCount),
  };
  [_eventDispatcher sendInputEventWithName:@"change" body:event];
}

- (void)textViewDidEndEditing:(UITextView *)textView
{
  [_eventDispatcher sendTextEventWithType:ABI7_0_0RCTTextEventTypeEnd
                                 ReactABI7_0_0Tag:self.ReactABI7_0_0Tag
                                     text:textView.text
                                      key:nil
                               eventCount:_nativeEventCount];

  [_eventDispatcher sendTextEventWithType:ABI7_0_0RCTTextEventTypeBlur
                                 ReactABI7_0_0Tag:self.ReactABI7_0_0Tag
                                     text:nil
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (BOOL)isFirstResponder
{
  return [_textView isFirstResponder];
}

- (BOOL)canBecomeFirstResponder
{
  return [_textView canBecomeFirstResponder];
}

- (void)ReactABI7_0_0WillMakeFirstResponder
{
  [_textView ReactABI7_0_0WillMakeFirstResponder];
}

- (BOOL)becomeFirstResponder
{
  return [_textView becomeFirstResponder];
}

- (void)ReactABI7_0_0DidMakeFirstResponder
{
  [_textView ReactABI7_0_0DidMakeFirstResponder];
}

- (BOOL)resignFirstResponder
{
  [super resignFirstResponder];
  return [_textView resignFirstResponder];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateFrames];
}

- (UIFont *)defaultPlaceholderFont
{
  return [UIFont systemFontOfSize:17];
}

- (UIColor *)defaultPlaceholderTextColor
{
  return [UIColor colorWithRed:0.0/255.0 green:0.0/255.0 blue:0.098/255.0 alpha:0.22];
}

@end
