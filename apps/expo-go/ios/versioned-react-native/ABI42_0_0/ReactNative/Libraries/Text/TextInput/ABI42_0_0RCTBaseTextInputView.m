/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTBaseTextInputView.h>

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>

#import <ABI42_0_0React/ABI42_0_0RCTInputAccessoryView.h>
#import <ABI42_0_0React/ABI42_0_0RCTInputAccessoryViewContent.h>
#import <ABI42_0_0React/ABI42_0_0RCTTextAttributes.h>
#import <ABI42_0_0React/ABI42_0_0RCTTextSelection.h>

@implementation ABI42_0_0RCTBaseTextInputView {
  __weak ABI42_0_0RCTBridge *_bridge;
  __weak ABI42_0_0RCTEventDispatcher *_eventDispatcher;
  BOOL _hasInputAccesoryView;
  NSString *_Nullable _predictedText;
  BOOL _didMoveToWindow;
}

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
{
  ABI42_0_0RCTAssertParam(bridge);

  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
  }

  return self;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)decoder)
ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

- (UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  ABI42_0_0RCTAssert(NO, @"-[ABI42_0_0RCTBaseTextInputView backedTextInputView] must be implemented in subclass.");
  return nil;
}

#pragma mark - ABI42_0_0RCTComponent

- (void)didUpdateABI42_0_0ReactSubviews
{
  // Do nothing.
}

#pragma mark - Properties

- (void)setTextAttributes:(ABI42_0_0RCTTextAttributes *)textAttributes
{
  _textAttributes = textAttributes;
  [self enforceTextAttributesIfNeeded];
}

- (void)enforceTextAttributesIfNeeded
{
  id<ABI42_0_0RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  NSDictionary<NSAttributedStringKey,id> *textAttributes = [[_textAttributes effectiveTextAttributes] mutableCopy];
  if ([textAttributes valueForKey:NSForegroundColorAttributeName] == nil) {
      [textAttributes setValue:[UIColor blackColor] forKey:NSForegroundColorAttributeName];
  }

  backedTextInputView.defaultTextAttributes = textAttributes;
}

- (void)setABI42_0_0ReactPaddingInsets:(UIEdgeInsets)ABI42_0_0ReactPaddingInsets
{
  _ABI42_0_0ReactPaddingInsets = ABI42_0_0ReactPaddingInsets;
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInset`.
  self.backedTextInputView.textContainerInset = ABI42_0_0ReactPaddingInsets;
  [self setNeedsLayout];
}

- (void)setABI42_0_0ReactBorderInsets:(UIEdgeInsets)ABI42_0_0ReactBorderInsets
{
  _ABI42_0_0ReactBorderInsets = ABI42_0_0ReactBorderInsets;
  // We apply `borderInsets` as `backedTextInputView` layout offset.
  self.backedTextInputView.frame = UIEdgeInsetsInsetRect(self.bounds, ABI42_0_0ReactBorderInsets);
  [self setNeedsLayout];
}

- (NSAttributedString *)attributedText
{
  return self.backedTextInputView.attributedText;
}

- (BOOL)textOf:(NSAttributedString*)newText equals:(NSAttributedString*)oldText{
  // When the dictation is running we can't update the attributed text on the backed up text view
  // because setting the attributed string will kill the dictation. This means that we can't impose
  // the settings on a dictation.
  // Similarly, when the user is in the middle of inputting some text in Japanese/Chinese, there will be styling on the
  // text that we should disregard. See https://developer.apple.com/documentation/uikit/uitextinput/1614489-markedtextrange?language=objc
  // for more info.
  // If the user added an emoji, the system adds a font attribute for the emoji and stores the original font in NSOriginalFont.
  // Lastly, when entering a password, etc., there will be additional styling on the field as the native text view
  // handles showing the last character for a split second.
  __block BOOL fontHasBeenUpdatedBySystem = false;
  [oldText enumerateAttribute:@"NSOriginalFont" inRange:NSMakeRange(0, oldText.length) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (value){
      fontHasBeenUpdatedBySystem = true;
    }
  }];

  BOOL shouldFallbackToBareTextComparison =
    [self.backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"dictation"] ||
    self.backedTextInputView.markedTextRange ||
    self.backedTextInputView.isSecureTextEntry ||
    fontHasBeenUpdatedBySystem;

  if (shouldFallbackToBareTextComparison) {
    return ([newText.string isEqualToString:oldText.string]);
  } else {
    return ([newText isEqualToAttributedString:oldText]);
  }
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  BOOL textNeedsUpdate = NO;
  // Remove tag attribute to ensure correct attributed string comparison.
  NSMutableAttributedString *const backedTextInputViewTextCopy = [self.backedTextInputView.attributedText mutableCopy];
  NSMutableAttributedString *const attributedTextCopy = [attributedText mutableCopy];

  [backedTextInputViewTextCopy removeAttribute:ABI42_0_0RCTTextAttributesTagAttributeName
                                         range:NSMakeRange(0, backedTextInputViewTextCopy.length)];

  [attributedTextCopy removeAttribute:ABI42_0_0RCTTextAttributesTagAttributeName
                                range:NSMakeRange(0, attributedTextCopy.length)];

  textNeedsUpdate = ([self textOf:attributedTextCopy equals:backedTextInputViewTextCopy] == NO);

  if (eventLag == 0 && textNeedsUpdate) {
    UITextRange *selection = self.backedTextInputView.selectedTextRange;
    NSInteger oldTextLength = self.backedTextInputView.attributedText.string.length;

    self.backedTextInputView.attributedText = attributedText;

    if (selection.empty) {
      // Maintaining a cursor position relative to the end of the old text.
      NSInteger offsetStart =
      [self.backedTextInputView offsetFromPosition:self.backedTextInputView.beginningOfDocument
                                        toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = attributedText.string.length - offsetFromEnd;
      UITextPosition *position =
      [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument
                                              offset:newOffset];
      [self.backedTextInputView setSelectedTextRange:[self.backedTextInputView textRangeFromPosition:position toPosition:position]
                                      notifyDelegate:YES];
    }

    [self updateLocalData];
  } else if (eventLag > ABI42_0_0RCTTextUpdateLagWarningThreshold) {
    ABI42_0_0RCTLog(@"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.", self.backedTextInputView.attributedText.string, (long long)eventLag);
  }
}

- (ABI42_0_0RCTTextSelection *)selection
{
  id<ABI42_0_0RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;
  UITextRange *selectedTextRange = backedTextInputView.selectedTextRange;
  return [[ABI42_0_0RCTTextSelection new] initWithStart:[backedTextInputView offsetFromPosition:backedTextInputView.beginningOfDocument toPosition:selectedTextRange.start]
                                           end:[backedTextInputView offsetFromPosition:backedTextInputView.beginningOfDocument toPosition:selectedTextRange.end]];
}

- (void)setSelection:(ABI42_0_0RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  id<ABI42_0_0RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  UITextRange *previousSelectedTextRange = backedTextInputView.selectedTextRange;
  UITextPosition *start = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument offset:selection.start];
  UITextPosition *end = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [backedTextInputView textRangeFromPosition:start toPosition:end];

  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![previousSelectedTextRange isEqual:selectedTextRange]) {
    [backedTextInputView setSelectedTextRange:selectedTextRange notifyDelegate:NO];
  } else if (eventLag > ABI42_0_0RCTTextUpdateLagWarningThreshold) {
    ABI42_0_0RCTLog(@"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.", backedTextInputView.attributedText.string, (long long)eventLag);
  }
}

- (void)setSelectionStart:(NSInteger)start
             selectionEnd:(NSInteger)end
{
  UITextPosition *startPosition = [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument
                                                                          offset:start];
  UITextPosition *endPosition = [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument
                                                                        offset:end];
  if (startPosition && endPosition) {
    UITextRange *range = [self.backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [self.backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
  }
}

- (void)setTextContentType:(NSString *)type
{
  #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED)
    static dispatch_once_t onceToken;
    static NSDictionary<NSString *, NSString *> *contentTypeMap;

    dispatch_once(&onceToken, ^{
      contentTypeMap = @{@"none": @"",
                          @"URL": UITextContentTypeURL,
                          @"addressCity": UITextContentTypeAddressCity,
                          @"addressCityAndState":UITextContentTypeAddressCityAndState,
                          @"addressState": UITextContentTypeAddressState,
                          @"countryName": UITextContentTypeCountryName,
                          @"creditCardNumber": UITextContentTypeCreditCardNumber,
                          @"emailAddress": UITextContentTypeEmailAddress,
                          @"familyName": UITextContentTypeFamilyName,
                          @"fullStreetAddress": UITextContentTypeFullStreetAddress,
                          @"givenName": UITextContentTypeGivenName,
                          @"jobTitle": UITextContentTypeJobTitle,
                          @"location": UITextContentTypeLocation,
                          @"middleName": UITextContentTypeMiddleName,
                          @"name": UITextContentTypeName,
                          @"namePrefix": UITextContentTypeNamePrefix,
                          @"nameSuffix": UITextContentTypeNameSuffix,
                          @"nickname": UITextContentTypeNickname,
                          @"organizationName": UITextContentTypeOrganizationName,
                          @"postalCode": UITextContentTypePostalCode,
                          @"streetAddressLine1": UITextContentTypeStreetAddressLine1,
                          @"streetAddressLine2": UITextContentTypeStreetAddressLine2,
                          @"sublocality": UITextContentTypeSublocality,
                          @"telephoneNumber": UITextContentTypeTelephoneNumber,
                          };

      #if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
        if (@available(iOS 11.0, tvOS 11.0, *)) {
          NSDictionary<NSString *, NSString *> * iOS11extras = @{@"username": UITextContentTypeUsername,
                                                                  @"password": UITextContentTypePassword};

          NSMutableDictionary<NSString *, NSString *> * iOS11baseMap = [contentTypeMap mutableCopy];
          [iOS11baseMap addEntriesFromDictionary:iOS11extras];

          contentTypeMap = [iOS11baseMap copy];
        }
      #endif

      #if __IPHONE_OS_VERSION_MAX_ALLOWED >= 120000 /* __IPHONE_12_0 */
        if (@available(iOS 12.0, tvOS 12.0, *)) {
          NSDictionary<NSString *, NSString *> * iOS12extras = @{@"newPassword": UITextContentTypeNewPassword,
                                                                  @"oneTimeCode": UITextContentTypeOneTimeCode};

          NSMutableDictionary<NSString *, NSString *> * iOS12baseMap = [contentTypeMap mutableCopy];
          [iOS12baseMap addEntriesFromDictionary:iOS12extras];

          contentTypeMap = [iOS12baseMap copy];
        }
      #endif
    });

    // Setting textContentType to an empty string will disable any
    // default behaviour, like the autofill bar for password inputs
    self.backedTextInputView.textContentType = contentTypeMap[type] ?: type;
  #endif
}


- (void)setPasswordRules:(NSString *)descriptor
{
  #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_12_0
    if (@available(iOS 12.0, *)) {
      self.backedTextInputView.passwordRules = [UITextInputPasswordRules passwordRulesWithDescriptor:descriptor];
    }
  #endif
}

- (UIKeyboardType)keyboardType
{
  return self.backedTextInputView.keyboardType;
}

- (void)setKeyboardType:(UIKeyboardType)keyboardType
{
  UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  if (textInputView.keyboardType != keyboardType) {
    textInputView.keyboardType = keyboardType;
    // Without the call to reloadInputViews, the keyboard will not change until the textview field (the first responder) loses and regains focus.
    if (textInputView.isFirstResponder) {
      [textInputView reloadInputViews];
    }
  }
}

#pragma mark - ABI42_0_0RCTBackedTextInputDelegate

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  if (_clearTextOnFocus) {
    self.backedTextInputView.attributedText = [NSAttributedString new];
  }

  if (_selectTextOnFocus) {
    [self.backedTextInputView selectAll:nil];
  }

  [_eventDispatcher sendTextEventWithType:ABI42_0_0RCTTextEventTypeFocus
                                 ABI42_0_0ReactTag:self.ABI42_0_0ReactTag
                                     text:self.backedTextInputView.attributedText.string
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
  [_eventDispatcher sendTextEventWithType:ABI42_0_0RCTTextEventTypeEnd
                                 ABI42_0_0ReactTag:self.ABI42_0_0ReactTag
                                     text:self.backedTextInputView.attributedText.string
                                      key:nil
                               eventCount:_nativeEventCount];

  [_eventDispatcher sendTextEventWithType:ABI42_0_0RCTTextEventTypeBlur
                                 ABI42_0_0ReactTag:self.ABI42_0_0ReactTag
                                     text:self.backedTextInputView.attributedText.string
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (BOOL)textInputShouldReturn
{
  // We send `submit` event here, in `textInputShouldReturn`
  // (not in `textInputDidReturn)`, because of semantic of the event:
  // `onSubmitEditing` is called when "Submit" button
  // (the blue key on onscreen keyboard) did pressed
  // (no connection to any specific "submitting" process).
  [_eventDispatcher sendTextEventWithType:ABI42_0_0RCTTextEventTypeSubmit
                                 ABI42_0_0ReactTag:self.ABI42_0_0ReactTag
                                     text:self.backedTextInputView.attributedText.string
                                      key:nil
                               eventCount:_nativeEventCount];

  return _blurOnSubmit;
}

- (void)textInputDidReturn
{
  // Does nothing.
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  id<ABI42_0_0RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  if (!backedTextInputView.textWasPasted) {
    [_eventDispatcher sendTextEventWithType:ABI42_0_0RCTTextEventTypeKeyPress
                                   ABI42_0_0ReactTag:self.ABI42_0_0ReactTag
                                       text:nil
                                        key:text
                                 eventCount:_nativeEventCount];
  }

  if (_maxLength) {
    NSInteger allowedLength = MAX(_maxLength.integerValue - (NSInteger)backedTextInputView.attributedText.string.length + (NSInteger)range.length, 0);

    if (text.length > allowedLength) {
      // If we typed/pasted more than one character, limit the text inputted.
      if (text.length > 1) {
        // Truncate the input string so the result is exactly maxLength
        NSString *limitedString = [text substringToIndex:allowedLength];
        NSMutableAttributedString *newAttributedText = [backedTextInputView.attributedText mutableCopy];
        // Apply text attributes if original input view doesn't have text.
        if (backedTextInputView.attributedText.length == 0) {
          newAttributedText = [[NSMutableAttributedString alloc] initWithString:[self.textAttributes applyTextAttributesToText:limitedString] attributes:self.textAttributes.effectiveTextAttributes];
        } else {
          [newAttributedText replaceCharactersInRange:range withString:limitedString];
        }
        backedTextInputView.attributedText = newAttributedText;
        _predictedText = newAttributedText.string;

        // Collapse selection at end of insert to match normal paste behavior.
        UITextPosition *insertEnd = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument
                                                                       offset:(range.location + allowedLength)];
        [backedTextInputView setSelectedTextRange:[backedTextInputView textRangeFromPosition:insertEnd toPosition:insertEnd]
                                   notifyDelegate:YES];

        [self textInputDidChange];
      }

      return nil; // Rejecting the change.
    }
  }

  NSString *previousText = backedTextInputView.attributedText.string ?: @"";

  if (range.location + range.length > backedTextInputView.attributedText.string.length) {
    _predictedText = backedTextInputView.attributedText.string;
  } else {
    _predictedText = [backedTextInputView.attributedText.string stringByReplacingCharactersInRange:range withString:text];
  }

  if (_onTextInput) {
    _onTextInput(@{
      @"text": text,
      @"previousText": previousText,
      @"range": @{
        @"start": @(range.location),
        @"end": @(range.location + range.length)
      },
      @"eventCount": @(_nativeEventCount),
    });
  }

  return text; // Accepting the change.
}

- (void)textInputDidChange
{
  [self updateLocalData];

  id<ABI42_0_0RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  // Detect when `backedTextInputView` updates happened that didn't invoke `shouldChangeTextInRange`
  // (e.g. typing simplified Chinese in pinyin will insert and remove spaces without
  // calling shouldChangeTextInRange).  This will cause JS to get out of sync so we
  // update the mismatched range.
  NSRange currentRange;
  NSRange predictionRange;
  if (findMismatch(backedTextInputView.attributedText.string, _predictedText, &currentRange, &predictionRange)) {
    NSString *replacement = [backedTextInputView.attributedText.string substringWithRange:currentRange];
    [self textInputShouldChangeText:replacement inRange:predictionRange];
    // JS will assume the selection changed based on the location of our shouldChangeTextInRange, so reset it.
    [self textInputDidChangeSelection];
  }

  _nativeEventCount++;

  if (_onChange) {
    _onChange(@{
       @"text": self.attributedText.string,
       @"target": self.ABI42_0_0ReactTag,
       @"eventCount": @(_nativeEventCount),
    });
  }
}

- (void)textInputDidChangeSelection
{
  if (!_onSelectionChange) {
    return;
  }

  ABI42_0_0RCTTextSelection *selection = self.selection;

  _onSelectionChange(@{
    @"selection": @{
      @"start": @(selection.start),
      @"end": @(selection.end),
    },
  });
}

- (void)updateLocalData
{
  [self enforceTextAttributesIfNeeded];

  [_bridge.uiManager setLocalData:[self.backedTextInputView.attributedText copy]
                          forView:self];
}

#pragma mark - Layout (in UIKit terms, with all insets)

- (CGSize)intrinsicContentSize
{
  CGSize size = self.backedTextInputView.intrinsicContentSize;
  size.width += _ABI42_0_0ReactBorderInsets.left + _ABI42_0_0ReactBorderInsets.right;
  size.height += _ABI42_0_0ReactBorderInsets.top + _ABI42_0_0ReactBorderInsets.bottom;
  // Returning value DOES include border and padding insets.
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGFloat compoundHorizontalBorderInset = _ABI42_0_0ReactBorderInsets.left + _ABI42_0_0ReactBorderInsets.right;
  CGFloat compoundVerticalBorderInset = _ABI42_0_0ReactBorderInsets.top + _ABI42_0_0ReactBorderInsets.bottom;

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

#pragma mark - Accessibility

- (UIView *)ABI42_0_0ReactAccessibilityElement
{
  return self.backedTextInputView;
}

#pragma mark - Focus Control

- (void)ABI42_0_0ReactFocus
{
  [self.backedTextInputView ABI42_0_0ReactFocus];
}

- (void)ABI42_0_0ReactBlur
{
  [self.backedTextInputView ABI42_0_0ReactBlur];
}

- (void)didMoveToWindow
{
  if (self.autoFocus && !_didMoveToWindow) {
    [self.backedTextInputView ABI42_0_0ReactFocus];
  } else {
    [self.backedTextInputView ABI42_0_0ReactFocusIfNeeded];
  }

  _didMoveToWindow = YES;
}

#pragma mark - Custom Input Accessory View

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if ([changedProps containsObject:@"inputAccessoryViewID"] && self.inputAccessoryViewID) {
    [self setCustomInputAccessoryViewWithNativeID:self.inputAccessoryViewID];
  } else if (!self.inputAccessoryViewID) {
    [self setDefaultInputAccessoryView];
  }
}

- (void)setCustomInputAccessoryViewWithNativeID:(NSString *)nativeID
{
  #if !TARGET_OS_TV
  __weak ABI42_0_0RCTBaseTextInputView *weakSelf = self;
  [_bridge.uiManager rootViewForABI42_0_0ReactTag:self.ABI42_0_0ReactTag withCompletion:^(UIView *rootView) {
    ABI42_0_0RCTBaseTextInputView *strongSelf = weakSelf;
    if (rootView) {
      UIView *accessoryView = [strongSelf->_bridge.uiManager viewForNativeID:nativeID
                                                                 withRootTag:rootView.ABI42_0_0ReactTag];
      if (accessoryView && [accessoryView isKindOfClass:[ABI42_0_0RCTInputAccessoryView class]]) {
        strongSelf.backedTextInputView.inputAccessoryView = ((ABI42_0_0RCTInputAccessoryView *)accessoryView).inputAccessoryView;
        [strongSelf reloadInputViewsIfNecessary];
      }
    }
  }];
  #endif /* !TARGET_OS_TV */
}

- (void)setDefaultInputAccessoryView
{
  #if !TARGET_OS_TV
  UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  UIKeyboardType keyboardType = textInputView.keyboardType;

  // These keyboard types (all are number pads) don't have a "Done" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccesoryView;
  if (@available(iOS 10.0, *)) {
      shouldHaveInputAccesoryView =
      (
       keyboardType == UIKeyboardTypeNumberPad ||
       keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad ||
       keyboardType == UIKeyboardTypeASCIICapableNumberPad
      ) &&
      textInputView.returnKeyType == UIReturnKeyDone;
  } else {
      shouldHaveInputAccesoryView =
      (
       keyboardType == UIKeyboardTypeNumberPad ||
       keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad
      ) &&
      textInputView.returnKeyType == UIReturnKeyDone;
  }

  if (_hasInputAccesoryView == shouldHaveInputAccesoryView) {
    return;
  }

  _hasInputAccesoryView = shouldHaveInputAccesoryView;

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
  [self reloadInputViewsIfNecessary];
  #endif /* !TARGET_OS_TV */
}

- (void)reloadInputViewsIfNecessary
{
  // We have to call `reloadInputViews` for focused text inputs to update an accessory view.
  if (self.backedTextInputView.isFirstResponder) {
    [self.backedTextInputView reloadInputViews];
  }
}

- (void)handleInputAccessoryDoneButton
{
  if ([self textInputShouldReturn]) {
    [self.backedTextInputView endEditing:YES];
  }
}

#pragma mark - Helpers

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

@end
