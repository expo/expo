/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTTextInputComponentView.h"

#import <ABI49_0_0React/ABI49_0_0renderer/components/iostextinput/TextInputComponentDescriptor.h>
#import <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0RCTAttributedTextUtils.h>
#import <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0TextLayoutManager.h>

#import <ABI49_0_0React/ABI49_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTUITextField.h>
#import <ABI49_0_0React/ABI49_0_0RCTUITextView.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

#import "ABI49_0_0RCTConversions.h"
#import "ABI49_0_0RCTTextInputNativeCommands.h"
#import "ABI49_0_0RCTTextInputUtils.h"

#import "ABI49_0_0RCTFabricComponentsPlugins.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

@interface ABI49_0_0RCTTextInputComponentView () <ABI49_0_0RCTBackedTextInputDelegate, ABI49_0_0RCTTextInputViewProtocol>
@end

@implementation ABI49_0_0RCTTextInputComponentView {
  TextInputShadowNode::ConcreteState::Shared _state;
  UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *_backedTextInputView;
  NSUInteger _mostRecentEventCount;
  NSAttributedString *_lastStringStateWasUpdatedWith;

  /*
   * UIKit uses either UITextField or UITextView as its UIKit element for <TextInput>. UITextField is for single line
   * entry, UITextView is for multiline entry. There is a problem with order of events when user types a character. In
   * UITextField (single line text entry), typing a character first triggers `onChange` event and then
   * onSelectionChange. In UITextView (multi line text entry), typing a character first triggers `onSelectionChange` and
   * then onChange. JavaScript depends on `onChange` to be called before `onSelectionChange`. This flag keeps state so
   * if UITextView is backing text input view, inside `-[ABI49_0_0RCTTextInputComponentView textInputDidChangeSelection]` we make
   * sure to call `onChange` before `onSelectionChange` and ignore next `-[ABI49_0_0RCTTextInputComponentView
   * textInputDidChange]` call.
   */
  BOOL _ignoreNextTextInputCall;

  /*
   * A flag that when set to true, `_mostRecentEventCount` won't be incremented when `[self _updateState]`
   * and delegate methods `textInputDidChange` and `textInputDidChangeSelection` will exit early.
   *
   * Setting `_backedTextInputView.attributedText` triggers delegate methods `textInputDidChange` and
   * `textInputDidChangeSelection` for multiline text input only.
   * In multiline text input this is undesirable as we don't want to be sending events for changes that JS triggered.
   */
  BOOL _comingFromJS;
  BOOL _didMoveToWindow;
}

#pragma mark - UIView overrides

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<TextInputProps const>();
    _props = defaultProps;
    auto &props = *defaultProps;

    _backedTextInputView = props.traits.multiline ? [ABI49_0_0RCTUITextView new] : [ABI49_0_0RCTUITextField new];
    _backedTextInputView.textInputDelegate = self;
    _ignoreNextTextInputCall = NO;
    _comingFromJS = NO;
    _didMoveToWindow = NO;
    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (self.window && !_didMoveToWindow) {
    auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
    if (props.autoFocus) {
      [_backedTextInputView becomeFirstResponder];
    }
    _didMoveToWindow = YES;
  }
  [self _restoreTextSelection];
}

#pragma mark - ABI49_0_0RCTViewComponentView overrides

- (NSObject *)accessibilityElement
{
  return _backedTextInputView;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<TextInputComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldTextInputProps = *std::static_pointer_cast<TextInputProps const>(_props);
  auto const &newTextInputProps = *std::static_pointer_cast<TextInputProps const>(props);

  // Traits:
  if (newTextInputProps.traits.multiline != oldTextInputProps.traits.multiline) {
    [self _setMultiline:newTextInputProps.traits.multiline];
  }

  if (newTextInputProps.traits.autocapitalizationType != oldTextInputProps.traits.autocapitalizationType) {
    _backedTextInputView.autocapitalizationType =
        ABI49_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(newTextInputProps.traits.autocapitalizationType);
  }

  if (newTextInputProps.traits.autoCorrect != oldTextInputProps.traits.autoCorrect) {
    _backedTextInputView.autocorrectionType =
        ABI49_0_0RCTUITextAutocorrectionTypeFromOptionalBool(newTextInputProps.traits.autoCorrect);
  }

  if (newTextInputProps.traits.contextMenuHidden != oldTextInputProps.traits.contextMenuHidden) {
    _backedTextInputView.contextMenuHidden = newTextInputProps.traits.contextMenuHidden;
  }

  if (newTextInputProps.traits.editable != oldTextInputProps.traits.editable) {
    _backedTextInputView.editable = newTextInputProps.traits.editable;
  }

  if (newTextInputProps.traits.enablesReturnKeyAutomatically !=
      oldTextInputProps.traits.enablesReturnKeyAutomatically) {
    _backedTextInputView.enablesReturnKeyAutomatically = newTextInputProps.traits.enablesReturnKeyAutomatically;
  }

  if (newTextInputProps.traits.keyboardAppearance != oldTextInputProps.traits.keyboardAppearance) {
    _backedTextInputView.keyboardAppearance =
        ABI49_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(newTextInputProps.traits.keyboardAppearance);
  }

  if (newTextInputProps.traits.spellCheck != oldTextInputProps.traits.spellCheck) {
    _backedTextInputView.spellCheckingType =
        ABI49_0_0RCTUITextSpellCheckingTypeFromOptionalBool(newTextInputProps.traits.spellCheck);
  }

  if (newTextInputProps.traits.caretHidden != oldTextInputProps.traits.caretHidden) {
    _backedTextInputView.caretHidden = newTextInputProps.traits.caretHidden;
  }

  if (newTextInputProps.traits.clearButtonMode != oldTextInputProps.traits.clearButtonMode) {
    _backedTextInputView.clearButtonMode =
        ABI49_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(newTextInputProps.traits.clearButtonMode);
  }

  if (newTextInputProps.traits.scrollEnabled != oldTextInputProps.traits.scrollEnabled) {
    _backedTextInputView.scrollEnabled = newTextInputProps.traits.scrollEnabled;
  }

  if (newTextInputProps.traits.secureTextEntry != oldTextInputProps.traits.secureTextEntry) {
    _backedTextInputView.secureTextEntry = newTextInputProps.traits.secureTextEntry;
  }

  if (newTextInputProps.traits.keyboardType != oldTextInputProps.traits.keyboardType) {
    _backedTextInputView.keyboardType = ABI49_0_0RCTUIKeyboardTypeFromKeyboardType(newTextInputProps.traits.keyboardType);
  }

  if (newTextInputProps.traits.returnKeyType != oldTextInputProps.traits.returnKeyType) {
    _backedTextInputView.returnKeyType = ABI49_0_0RCTUIReturnKeyTypeFromReturnKeyType(newTextInputProps.traits.returnKeyType);
  }

  if (newTextInputProps.traits.textContentType != oldTextInputProps.traits.textContentType) {
    _backedTextInputView.textContentType = ABI49_0_0RCTUITextContentTypeFromString(newTextInputProps.traits.textContentType);
  }

  if (newTextInputProps.traits.passwordRules != oldTextInputProps.traits.passwordRules) {
    if (@available(iOS 12.0, *)) {
      _backedTextInputView.passwordRules =
          ABI49_0_0RCTUITextInputPasswordRulesFromString(newTextInputProps.traits.passwordRules);
    }
  }

  // Traits `blurOnSubmit`, `clearTextOnFocus`, and `selectTextOnFocus` were omitted intentionally here
  // because they are being checked on-demand.

  // Other props:
  if (newTextInputProps.placeholder != oldTextInputProps.placeholder) {
    _backedTextInputView.placeholder = ABI49_0_0RCTNSStringFromString(newTextInputProps.placeholder);
  }

  if (newTextInputProps.placeholderTextColor != oldTextInputProps.placeholderTextColor) {
    _backedTextInputView.placeholderColor = ABI49_0_0RCTUIColorFromSharedColor(newTextInputProps.placeholderTextColor);
  }

  if (newTextInputProps.textAttributes != oldTextInputProps.textAttributes) {
    _backedTextInputView.defaultTextAttributes =
        ABI49_0_0RCTNSTextAttributesFromTextAttributes(newTextInputProps.getEffectiveTextAttributes(ABI49_0_0RCTFontSizeMultiplier()));
  }

  if (newTextInputProps.selectionColor != oldTextInputProps.selectionColor) {
    _backedTextInputView.tintColor = ABI49_0_0RCTUIColorFromSharedColor(newTextInputProps.selectionColor);
  }

  if (newTextInputProps.inputAccessoryViewID != oldTextInputProps.inputAccessoryViewID) {
    _backedTextInputView.inputAccessoryViewID = ABI49_0_0RCTNSStringFromString(newTextInputProps.inputAccessoryViewID);
  }
  [super updateProps:props oldProps:oldProps];

  [self setDefaultInputAccessoryView];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<TextInputShadowNode::ConcreteState const>(state);

  if (!_state) {
    assert(false && "State is `null` for <TextInput> component.");
    _backedTextInputView.attributedText = nil;
    return;
  }

  auto data = _state->getData();

  if (!oldState) {
    _mostRecentEventCount = _state->getData().mostRecentEventCount;
  }

  if (_mostRecentEventCount == _state->getData().mostRecentEventCount) {
    _comingFromJS = YES;
    [self _setAttributedString:ABI49_0_0RCTNSAttributedStringFromAttributedStringBox(data.attributedStringBox)];
    _comingFromJS = NO;
  }
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  _backedTextInputView.frame =
      UIEdgeInsetsInsetRect(self.bounds, ABI49_0_0RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.borderWidth));
  _backedTextInputView.textContainerInset =
      ABI49_0_0RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.contentInsets - layoutMetrics.borderWidth);

  if (_eventEmitter) {
    auto const &textInputEventEmitter = *std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter);
    textInputEventEmitter.onContentSizeChange([self _textInputMetrics]);
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _backedTextInputView.attributedText = nil;
  _mostRecentEventCount = 0;
  _comingFromJS = NO;
  _lastStringStateWasUpdatedWith = nil;
  _ignoreNextTextInputCall = NO;
  _didMoveToWindow = NO;
  [_backedTextInputView resignFirstResponder];
}

#pragma mark - ABI49_0_0RCTBackedTextInputDelegate

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);

  if (props.traits.clearTextOnFocus) {
    _backedTextInputView.attributedText = nil;
    [self textInputDidChange];
  }

  if (props.traits.selectTextOnFocus) {
    [_backedTextInputView selectAll:nil];
    [self textInputDidChangeSelection];
  }

  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onFocus([self _textInputMetrics]);
  }
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onEndEditing([self _textInputMetrics]);
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onBlur([self _textInputMetrics]);
  }
}

- (BOOL)textInputShouldSubmitOnReturn
{
  const SubmitBehavior submitBehavior = [self getSubmitBehavior];
  const BOOL shouldSubmit = submitBehavior == SubmitBehavior::Submit || submitBehavior == SubmitBehavior::BlurAndSubmit;
  // We send `submit` event here, in `textInputShouldSubmitOnReturn`
  // (not in `textInputDidReturn)`, because of semantic of the event:
  // `onSubmitEditing` is called when "Submit" button
  // (the blue key on onscreen keyboard) did pressed
  // (no connection to any specific "submitting" process).

  if (_eventEmitter && shouldSubmit) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onSubmitEditing([self _textInputMetrics]);
  }
  return shouldSubmit;
}

- (BOOL)textInputShouldReturn
{
  return [self getSubmitBehavior] == SubmitBehavior::BlurAndSubmit;
}

- (void)textInputDidReturn
{
  // Does nothing.
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);

  if (!_backedTextInputView.textWasPasted) {
    if (_eventEmitter) {
      KeyPressMetrics keyPressMetrics;
      keyPressMetrics.text = ABI49_0_0RCTStringFromNSString(text);
      keyPressMetrics.eventCount = _mostRecentEventCount;

      auto const &textInputEventEmitter = *std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter);
      if (props.onKeyPressSync) {
        textInputEventEmitter.onKeyPressSync(keyPressMetrics);
      } else {
        textInputEventEmitter.onKeyPress(keyPressMetrics);
      }
    }
  }

  if (props.maxLength) {
    NSInteger allowedLength = props.maxLength - _backedTextInputView.attributedText.string.length + range.length;

    if (allowedLength > 0 && text.length > allowedLength) {
      // make sure unicode characters that are longer than 16 bits (such as emojis) are not cut off
      NSRange cutOffCharacterRange = [text rangeOfComposedCharacterSequenceAtIndex:allowedLength - 1];
      if (cutOffCharacterRange.location + cutOffCharacterRange.length > allowedLength) {
        // the character at the length limit takes more than 16bits, truncation should end at the character before
        allowedLength = cutOffCharacterRange.location;
      }
    }

    if (allowedLength <= 0) {
      return nil;
    }

    return allowedLength > text.length ? text : [text substringToIndex:allowedLength];
  }

  return text;
}

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  return YES;
}

- (void)textInputDidChange
{
  if (_comingFromJS) {
    return;
  }

  if (_ignoreNextTextInputCall && [_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    _ignoreNextTextInputCall = NO;
    return;
  }

  [self _updateState];

  if (_eventEmitter) {
    auto const &textInputEventEmitter = *std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter);
    auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
    if (props.onChangeSync) {
      textInputEventEmitter.onChangeSync([self _textInputMetrics]);
    } else {
      textInputEventEmitter.onChange([self _textInputMetrics]);
    }
  }
}

- (void)textInputDidChangeSelection
{
  if (_comingFromJS) {
    return;
  }
  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
  if (props.traits.multiline && ![_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    [self textInputDidChange];
    _ignoreNextTextInputCall = YES;
  }

  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onSelectionChange([self _textInputMetrics]);
  }
}

#pragma mark - ABI49_0_0RCTBackedTextInputDelegate (UIScrollViewDelegate)

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onScroll([self _textInputMetrics]);
  }
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  ABI49_0_0RCTTextInputHandleCommand(self, commandName, args);
}

- (void)focus
{
  [_backedTextInputView becomeFirstResponder];
}

- (void)blur
{
  [_backedTextInputView resignFirstResponder];
}

- (void)setTextAndSelection:(NSInteger)eventCount
                      value:(NSString *__nullable)value
                      start:(NSInteger)start
                        end:(NSInteger)end
{
  if (_mostRecentEventCount != eventCount) {
    return;
  }
  _comingFromJS = YES;
  if (value && ![value isEqualToString:_backedTextInputView.attributedText.string]) {
    NSAttributedString *attributedString =
        [[NSAttributedString alloc] initWithString:value attributes:_backedTextInputView.defaultTextAttributes];
    [self _setAttributedString:attributedString];
    [self _updateState];
  }

  UITextPosition *startPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                      offset:start];
  UITextPosition *endPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                    offset:end];

  if (startPosition && endPosition) {
    UITextRange *range = [_backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [_backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
  }
  _comingFromJS = NO;
}

#pragma mark - Default input accessory view

- (void)setDefaultInputAccessoryView
{
  // InputAccessoryView component sets the inputAccessoryView when inputAccessoryViewID exists
  if (_backedTextInputView.inputAccessoryViewID) {
    if (_backedTextInputView.isFirstResponder) {
      [_backedTextInputView reloadInputViews];
    }
    return;
  }

  UIKeyboardType keyboardType = _backedTextInputView.keyboardType;

  // These keyboard types (all are number pads) don't have a "Done" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccessoryView =
      (keyboardType == UIKeyboardTypeNumberPad || keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad || keyboardType == UIKeyboardTypeASCIICapableNumberPad) &&
      _backedTextInputView.returnKeyType == UIReturnKeyDone;

  if ((_backedTextInputView.inputAccessoryView != nil) == shouldHaveInputAccessoryView) {
    return;
  }

  if (shouldHaveInputAccessoryView) {
    UIToolbar *toolbarView = [UIToolbar new];
    [toolbarView sizeToFit];
    UIBarButtonItem *flexibleSpace =
        [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];
    UIBarButtonItem *doneButton =
        [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                      target:self
                                                      action:@selector(handleInputAccessoryDoneButton)];
    toolbarView.items = @[ flexibleSpace, doneButton ];
    _backedTextInputView.inputAccessoryView = toolbarView;
  } else {
    _backedTextInputView.inputAccessoryView = nil;
  }

  if (_backedTextInputView.isFirstResponder) {
    [_backedTextInputView reloadInputViews];
  }
}

- (void)handleInputAccessoryDoneButton
{
  if ([self textInputShouldReturn]) {
    [_backedTextInputView endEditing:YES];
  }
}

#pragma mark - Other

- (TextInputMetrics)_textInputMetrics
{
  TextInputMetrics metrics;
  metrics.text = ABI49_0_0RCTStringFromNSString(_backedTextInputView.attributedText.string);
  metrics.selectionRange = [self _selectionRange];
  metrics.eventCount = _mostRecentEventCount;

  CGPoint contentOffset = _backedTextInputView.contentOffset;
  metrics.contentOffset = {contentOffset.x, contentOffset.y};

  UIEdgeInsets contentInset = _backedTextInputView.contentInset;
  metrics.contentInset = {contentInset.left, contentInset.top, contentInset.right, contentInset.bottom};

  CGSize contentSize = _backedTextInputView.contentSize;
  metrics.contentSize = {contentSize.width, contentSize.height};

  CGSize layoutMeasurement = _backedTextInputView.bounds.size;
  metrics.layoutMeasurement = {layoutMeasurement.width, layoutMeasurement.height};

  CGFloat zoomScale = _backedTextInputView.zoomScale;
  metrics.zoomScale = zoomScale;

  return metrics;
}

- (void)_updateState
{
  if (!_state) {
    return;
  }
  NSAttributedString *attributedString = _backedTextInputView.attributedText;
  auto data = _state->getData();
  _lastStringStateWasUpdatedWith = attributedString;
  data.attributedStringBox = ABI49_0_0RCTAttributedStringBoxFromNSAttributedString(attributedString);
  _mostRecentEventCount += _comingFromJS ? 0 : 1;
  data.mostRecentEventCount = _mostRecentEventCount;
  _state->updateState(std::move(data));
}

- (AttributedString::Range)_selectionRange
{
  UITextRange *selectedTextRange = _backedTextInputView.selectedTextRange;
  NSInteger start = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                  toPosition:selectedTextRange.start];
  NSInteger end = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                toPosition:selectedTextRange.end];
  return AttributedString::Range{(int)start, (int)(end - start)};
}

- (void)_restoreTextSelection
{
  auto const selection = std::dynamic_pointer_cast<TextInputProps const>(_props)->selection;
  if (!selection.has_value()) {
    return;
  }
  auto start = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                   offset:selection->start];
  auto end = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument offset:selection->end];
  auto range = [_backedTextInputView textRangeFromPosition:start toPosition:end];
  [_backedTextInputView setSelectedTextRange:range notifyDelegate:YES];
}

- (void)_setAttributedString:(NSAttributedString *)attributedString
{
  if ([self _textOf:attributedString equals:_backedTextInputView.attributedText]) {
    return;
  }
  UITextRange *selectedRange = _backedTextInputView.selectedTextRange;
  NSInteger oldTextLength = _backedTextInputView.attributedText.string.length;
  _backedTextInputView.attributedText = attributedString;
  if (selectedRange.empty) {
    // Maintaining a cursor position relative to the end of the old text.
    NSInteger offsetStart = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                          toPosition:selectedRange.start];
    NSInteger offsetFromEnd = oldTextLength - offsetStart;
    NSInteger newOffset = attributedString.string.length - offsetFromEnd;
    UITextPosition *position = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                   offset:newOffset];
    [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                                notifyDelegate:YES];
  }
  [self _restoreTextSelection];
  _lastStringStateWasUpdatedWith = attributedString;
}

- (void)_setMultiline:(BOOL)multiline
{
  [_backedTextInputView removeFromSuperview];
  UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *backedTextInputView = multiline ? [ABI49_0_0RCTUITextView new] : [ABI49_0_0RCTUITextField new];
  backedTextInputView.frame = _backedTextInputView.frame;
  ABI49_0_0RCTCopyBackedTextInput(_backedTextInputView, backedTextInputView);
  _backedTextInputView = backedTextInputView;
  [self addSubview:_backedTextInputView];
}

- (BOOL)_textOf:(NSAttributedString *)newText equals:(NSAttributedString *)oldText
{
  // When the dictation is running we can't update the attributed text on the backed up text view
  // because setting the attributed string will kill the dictation. This means that we can't impose
  // the settings on a dictation.
  // Similarly, when the user is in the middle of inputting some text in Japanese/Chinese, there will be styling on the
  // text that we should disregard. See
  // https://developer.apple.com/documentation/uikit/uitextinput/1614489-markedtextrange?language=objc for more info.
  // Also, updating the attributed text while inputting Korean language will break input mechanism.
  // If the user added an emoji, the system adds a font attribute for the emoji and stores the original font in
  // NSOriginalFont. Lastly, when entering a password, etc., there will be additional styling on the field as the native
  // text view handles showing the last character for a split second.
  __block BOOL fontHasBeenUpdatedBySystem = false;
  [oldText enumerateAttribute:@"NSOriginalFont"
                      inRange:NSMakeRange(0, oldText.length)
                      options:0
                   usingBlock:^(id value, NSRange range, BOOL *stop) {
                     if (value) {
                       fontHasBeenUpdatedBySystem = true;
                     }
                   }];

  BOOL shouldFallbackToBareTextComparison =
      [_backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"dictation"] ||
      [_backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"ko-KR"] ||
      _backedTextInputView.markedTextRange || _backedTextInputView.isSecureTextEntry || fontHasBeenUpdatedBySystem;

  if (shouldFallbackToBareTextComparison) {
    return ([newText.string isEqualToString:oldText.string]);
  } else {
    return ([newText isEqualToAttributedString:oldText]);
  }
}

- (SubmitBehavior)getSubmitBehavior
{
  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
  const SubmitBehavior submitBehaviorDefaultable = props.traits.submitBehavior;

  // We should always have a non-default `submitBehavior`, but in case we don't, set it based on multiline.
  if (submitBehaviorDefaultable == SubmitBehavior::Default) {
    return props.traits.multiline ? SubmitBehavior::Newline : SubmitBehavior::BlurAndSubmit;
  }

  return submitBehaviorDefaultable;
}

@end

Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RCTTextInputCls(void)
{
  return ABI49_0_0RCTTextInputComponentView.class;
}
