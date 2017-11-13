/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTTextView.h"

#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTEventDispatcher.h>
#import <ReactABI23_0_0/ABI23_0_0RCTFont.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUIManager.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUtils.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>

#import "ABI23_0_0RCTShadowText.h"
#import "ABI23_0_0RCTText.h"
#import "ABI23_0_0RCTTextSelection.h"
#import "ABI23_0_0RCTUITextView.h"

@interface ABI23_0_0RCTTextView () <ABI23_0_0RCTBackedTextInputDelegate>

@end

@implementation ABI23_0_0RCTTextView
{
  ABI23_0_0RCTUITextView *_backedTextInput;
  ABI23_0_0RCTText *_richTextView;
  NSAttributedString *_pendingAttributedText;

  NSString *_predictedText;

  BOOL _blockTextShouldChange;
  BOOL _nativeUpdatesInFlight;
}

- (instancetype)initWithBridge:(ABI23_0_0RCTBridge *)bridge
{
  ABI23_0_0RCTAssertParam(bridge);

  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `false` for <TextInput multiline={true}> by design.
    _blurOnSubmit = NO;

    _backedTextInput = [[ABI23_0_0RCTUITextView alloc] initWithFrame:self.bounds];
    _backedTextInput.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInput.backgroundColor = [UIColor clearColor];
    _backedTextInput.textColor = [UIColor blackColor];
    // This line actually removes 5pt (default value) left and right padding in UITextView.
    _backedTextInput.textContainer.lineFragmentPadding = 0;
#if !TARGET_OS_TV
    _backedTextInput.scrollsToTop = NO;
#endif
    _backedTextInput.scrollEnabled = YES;
    _backedTextInput.textInputDelegate = self;
    _backedTextInput.font = self.fontAttributes.font;

    [self addSubview:_backedTextInput];
  }
  return self;
}

ABI23_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI23_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (id<ABI23_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInput;
}

#pragma mark - ABI23_0_0RCTComponent

- (void)insertReactABI23_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI23_0_0Subview:subview atIndex:index];

  if ([subview isKindOfClass:[ABI23_0_0RCTText class]]) {
    if (_richTextView) {
      ABI23_0_0RCTLogError(@"Tried to insert a second <Text> into <TextInput> - there can only be one.");
    }
    _richTextView = (ABI23_0_0RCTText *)subview;

    // If this <TextInput> is in rich text editing mode, and the child <Text> node providing rich text
    // styling has a backgroundColor, then the attributedText produced by the child <Text> node will have an
    // NSBackgroundColor attribute. We need to forward this attribute to the text view manually because the text view
    // always has a clear background color in `initWithBridge:`.
    //
    // TODO: This should be removed when the related hack in -performPendingTextUpdate is removed.
    if (subview.backgroundColor) {
      NSMutableDictionary<NSString *, id> *attrs = [_backedTextInput.typingAttributes mutableCopy];
      attrs[NSBackgroundColorAttributeName] = subview.backgroundColor;
      _backedTextInput.typingAttributes = attrs;
    }

    [self performTextUpdate];
  }
}

- (void)removeReactABI23_0_0Subview:(UIView *)subview
{
  [super removeReactABI23_0_0Subview:subview];
  if (_richTextView == subview) {
    _richTextView = nil;
    [self performTextUpdate];
  }
}

- (void)didUpdateReactABI23_0_0Subviews
{
  // Do nothing, as we don't allow non-text subviews.
}

#pragma mark - Routine

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
    _backedTextInput.attributedText = nil;
  }
}

static NSAttributedString *removeReactABI23_0_0TagFromString(NSAttributedString *string)
{
  if (string.length == 0) {
    return string;
  } else {
    NSMutableAttributedString *mutableString = [[NSMutableAttributedString alloc] initWithAttributedString:string];
    [mutableString removeAttribute:ABI23_0_0RCTReactABI23_0_0TagAttributeName range:NSMakeRange(0, mutableString.length)];
    return mutableString;
  }
}

- (void)performPendingTextUpdate
{
  if (!_pendingAttributedText || _mostRecentEventCount < _nativeEventCount || _nativeUpdatesInFlight) {
    return;
  }

  // The underlying <Text> node that produces _pendingAttributedText has a ReactABI23_0_0 tag attribute on it that causes the
  // -isEqualToAttributedString: comparison below to spuriously fail. We don't want that comparison to fail unless it
  // needs to because when the comparison fails, we end up setting attributedText on the text view, which clears
  // autocomplete state for CKJ text input.
  //
  // TODO: Kill this after we finish passing all style/attribute info into JS.
  _pendingAttributedText = removeReactABI23_0_0TagFromString(_pendingAttributedText);

  if ([_backedTextInput.attributedText isEqualToAttributedString:_pendingAttributedText]) {
    _pendingAttributedText = nil; // Don't try again.
    return;
  }

  // When we update the attributed text, there might be pending autocorrections
  // that will get accepted by default. In order for this to not garble our text,
  // we temporarily block all textShouldChange events so they are not applied.
  _blockTextShouldChange = YES;

  UITextRange *selection = _backedTextInput.selectedTextRange;
  NSInteger oldTextLength = _backedTextInput.attributedText.length;

  _backedTextInput.attributedText = _pendingAttributedText;
  _predictedText = _pendingAttributedText.string;
  _pendingAttributedText = nil;

  if (selection.empty) {
    // maintain cursor position relative to the end of the old text
    NSInteger start = [_backedTextInput offsetFromPosition:_backedTextInput.beginningOfDocument toPosition:selection.start];
    NSInteger offsetFromEnd = oldTextLength - start;
    NSInteger newOffset = _backedTextInput.attributedText.length - offsetFromEnd;
    UITextPosition *position = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument offset:newOffset];
    [_backedTextInput setSelectedTextRange:[_backedTextInput textRangeFromPosition:position toPosition:position]
                            notifyDelegate:YES];
  }

  [_backedTextInput layoutIfNeeded];

  [self invalidateContentSize];

  _blockTextShouldChange = NO;
}

#pragma mark - Properties

- (UIFont *)font
{
  return _backedTextInput.font;
}

- (void)setFont:(UIFont *)font
{
  _backedTextInput.font = font;
  [self setNeedsLayout];
}

- (NSString *)text
{
  return _backedTextInput.text;
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:_backedTextInput.text]) {
    UITextRange *selection = _backedTextInput.selectedTextRange;
    NSInteger oldTextLength = _backedTextInput.text.length;

    _predictedText = text;
    _backedTextInput.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger start = [_backedTextInput offsetFromPosition:_backedTextInput.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - start;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument offset:newOffset];
      [_backedTextInput setSelectedTextRange:[_backedTextInput textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];
    }

    [self invalidateContentSize];
  } else if (eventLag > ABI23_0_0RCTTextUpdateLagWarningThreshold) {
    ABI23_0_0RCTLogWarn(@"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.", self.text, (long long)eventLag);
  }
}

#pragma mark - ABI23_0_0RCTBackedTextInputDelegate

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  if (!_backedTextInput.textWasPasted) {
    [_eventDispatcher sendTextEventWithType:ABI23_0_0RCTTextEventTypeKeyPress
                                   ReactABI23_0_0Tag:self.ReactABI23_0_0Tag
                                       text:nil
                                        key:text
                                 eventCount:_nativeEventCount];
  }

  // So we need to track that there is a native update in flight just in case JS manages to come back around and update
  // things /before/ UITextView can update itself asynchronously.  If there is a native update in flight, we defer the
  // JS update when it comes in and apply the deferred update once textViewDidChange fires with the native update applied.
  if (_blockTextShouldChange) {
    return NO;
  }

  if (_maxLength) {
    NSUInteger allowedLength = _maxLength.integerValue - _backedTextInput.text.length + range.length;
    if (text.length > allowedLength) {
      // If we typed/pasted more than one character, limit the text inputted
      if (text.length > 1) {
        // Truncate the input string so the result is exactly maxLength
        NSString *limitedString = [text substringToIndex:allowedLength];
        NSMutableString *newString = _backedTextInput.text.mutableCopy;
        [newString replaceCharactersInRange:range withString:limitedString];
        _backedTextInput.text = newString;
        _predictedText = newString;

        // Collapse selection at end of insert to match normal paste behavior
        UITextPosition *insertEnd = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument
                                                            offset:(range.location + allowedLength)];
        [_backedTextInput setSelectedTextRange:[_backedTextInput textRangeFromPosition:insertEnd toPosition:insertEnd]
                                notifyDelegate:YES];

        [self textInputDidChange];
      }
      return NO;
    }
  }

  _nativeUpdatesInFlight = YES;

  if (range.location + range.length > _predictedText.length) {
    // _predictedText got out of sync in a bad way, so let's just force sync it.  Haven't been able to repro this, but
    // it's causing a real crash here: #6523822
    _predictedText = _backedTextInput.text;
  }

  NSString *previousText = [_predictedText substringWithRange:range];
  if (_predictedText) {
    _predictedText = [_predictedText stringByReplacingCharactersInRange:range withString:text];
  } else {
    _predictedText = text;
  }

  if (_onTextInput) {
    _onTextInput(@{
      @"text": text,
      @"previousText": previousText ?: @"",
      @"range": @{
        @"start": @(range.location),
        @"end": @(range.location + range.length)
      },
      @"eventCount": @(_nativeEventCount),
    });
  }

  return YES;
}

static BOOL findMismatch(NSString *first, NSString *second, NSRange *firstRange, NSRange *secondRange)
{
  NSInteger firstMismatch = -1;
  for (NSUInteger ii = 0; ii < MAX(first.length, second.length); ii++) {
    if (ii >= first.length || ii >= second.length || [first characterAtIndex:ii] != [second characterAtIndex:ii]) {
      firstMismatch = ii;
      break;
    }
  }

  if (firstMismatch == -1) {
    return NO;
  }

  NSUInteger ii = second.length;
  NSUInteger lastMismatch = first.length;
  while (ii > firstMismatch && lastMismatch > firstMismatch) {
    if ([first characterAtIndex:(lastMismatch - 1)] != [second characterAtIndex:(ii - 1)]) {
      break;
    }
    ii--;
    lastMismatch--;
  }

  *firstRange = NSMakeRange(firstMismatch, lastMismatch - firstMismatch);
  *secondRange = NSMakeRange(firstMismatch, ii - firstMismatch);
  return YES;
}

- (void)textInputDidChange
{
  [self invalidateContentSize];

  // Detect when _backedTextInput updates happend that didn't invoke `shouldChangeTextInRange`
  // (e.g. typing simplified chinese in pinyin will insert and remove spaces without
  // calling shouldChangeTextInRange).  This will cause JS to get out of sync so we
  // update the mismatched range.
  NSRange currentRange;
  NSRange predictionRange;
  if (findMismatch(_backedTextInput.text, _predictedText, &currentRange, &predictionRange)) {
    NSString *replacement = [_backedTextInput.text substringWithRange:currentRange];
    [self textInputShouldChangeTextInRange:predictionRange replacementText:replacement];
    // JS will assume the selection changed based on the location of our shouldChangeTextInRange, so reset it.
    [self textInputDidChangeSelection];
    _predictedText = _backedTextInput.text;
  }

  _nativeUpdatesInFlight = NO;
  _nativeEventCount++;

  if (!self.ReactABI23_0_0Tag || !_onChange) {
    return;
  }

  _onChange(@{
    @"text": self.text,
    @"target": self.ReactABI23_0_0Tag,
    @"eventCount": @(_nativeEventCount),
  });
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (_onScroll) {
    CGPoint contentOffset = scrollView.contentOffset;
    CGSize contentSize = scrollView.contentSize;
    CGSize size = scrollView.bounds.size;
    UIEdgeInsets contentInset = scrollView.contentInset;

    _onScroll(@{
      @"contentOffset": @{
        @"x": @(contentOffset.x),
        @"y": @(contentOffset.y)
      },
      @"contentInset": @{
        @"top": @(contentInset.top),
        @"left": @(contentInset.left),
        @"bottom": @(contentInset.bottom),
        @"right": @(contentInset.right)
      },
      @"contentSize": @{
        @"width": @(contentSize.width),
        @"height": @(contentSize.height)
      },
      @"layoutMeasurement": @{
        @"width": @(size.width),
        @"height": @(size.height)
      },
      @"zoomScale": @(scrollView.zoomScale ?: 1),
    });
  }
}

@end
