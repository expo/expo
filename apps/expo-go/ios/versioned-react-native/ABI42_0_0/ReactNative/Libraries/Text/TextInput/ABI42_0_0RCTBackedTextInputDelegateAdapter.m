/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTBackedTextInputDelegateAdapter.h>

#pragma mark - ABI42_0_0RCTBackedTextFieldDelegateAdapter (for UITextField)

static void *TextFieldSelectionObservingContext = &TextFieldSelectionObservingContext;

@interface ABI42_0_0RCTBackedTextFieldDelegateAdapter () <UITextFieldDelegate>
@end

@implementation ABI42_0_0RCTBackedTextFieldDelegateAdapter {
  __weak UITextField<ABI42_0_0RCTBackedTextInputViewProtocol> *_backedTextInputView;
  BOOL _textDidChangeIsComing;
  UITextRange *_previousSelectedTextRange;
}

- (instancetype)initWithTextField:(UITextField<ABI42_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;

    [_backedTextInputView addTarget:self action:@selector(textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [_backedTextInputView addTarget:self action:@selector(textFieldDidEndEditingOnExit) forControlEvents:UIControlEventEditingDidEndOnExit];
  }

  return self;
}

- (void)dealloc
{
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingChanged];
  [_backedTextInputView removeTarget:self action:nil forControlEvents:UIControlEventEditingDidEndOnExit];
}

#pragma mark - UITextFieldDelegate

- (BOOL)textFieldShouldBeginEditing:(__unused UITextField *)textField
{
  return [_backedTextInputView.textInputDelegate textInputShouldBeginEditing];
}

- (void)textFieldDidBeginEditing:(__unused UITextField *)textField
{
  [_backedTextInputView.textInputDelegate textInputDidBeginEditing];
}

- (BOOL)textFieldShouldEndEditing:(__unused UITextField *)textField
{
  return [_backedTextInputView.textInputDelegate textInputShouldEndEditing];
}

- (void)textFieldDidEndEditing:(__unused UITextField *)textField
{
  if (_textDidChangeIsComing) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by losing focus. So, we call it manually.
    _textDidChangeIsComing = NO;
    [_backedTextInputView.textInputDelegate textInputDidChange];
  }

  [_backedTextInputView.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textField:(__unused UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  NSString *newText =
    [_backedTextInputView.textInputDelegate textInputShouldChangeText:string inRange:range];

  if (newText == nil) {
    return NO;
  }

  if ([newText isEqualToString:string]) {
    _textDidChangeIsComing = YES;
    return YES;
  }

  NSMutableAttributedString *attributedString = [_backedTextInputView.attributedText mutableCopy];
  [attributedString replaceCharactersInRange:range withString:newText];
  [_backedTextInputView setAttributedText:[attributedString copy]];

  // Setting selection to the end of the replaced text.
  UITextPosition *position =
    [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                        offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];

  [self textFieldDidChange];

  return NO;
}

- (BOOL)textFieldShouldReturn:(__unused UITextField *)textField
{
  return [_backedTextInputView.textInputDelegate textInputShouldReturn];
}

#pragma mark - UIControlEventEditing* Family Events

- (void)textFieldDidChange
{
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];

  // `selectedTextRangeWasSet` isn't triggered during typing.
  [self textFieldProbablyDidChangeSelection];
}

- (void)textFieldDidEndEditingOnExit
{
  [_backedTextInputView.textInputDelegate textInputDidReturn];
}

#pragma mark - UIKeyboardInput (private UIKit protocol)

// This method allows us to detect a [Backspace] `keyPress`
// even when there is no more text in the `UITextField`.
- (BOOL)keyboardInputShouldDelete:(__unused UITextField *)textField
{
  [_backedTextInputView.textInputDelegate textInputShouldChangeText:@"" inRange:NSMakeRange(0, 0)];
  return YES;
}

#pragma mark - Public Interface

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
{
  _previousSelectedTextRange = textRange;
}

- (void)selectedTextRangeWasSet
{
  [self textFieldProbablyDidChangeSelection];
}

#pragma mark - Generalization

- (void)textFieldProbablyDidChangeSelection
{
  if ([_backedTextInputView.selectedTextRange isEqual:_previousSelectedTextRange]) {
    return;
  }

  _previousSelectedTextRange = _backedTextInputView.selectedTextRange;
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end

#pragma mark - ABI42_0_0RCTBackedTextViewDelegateAdapter (for UITextView)

@interface ABI42_0_0RCTBackedTextViewDelegateAdapter () <UITextViewDelegate>
@end

@implementation ABI42_0_0RCTBackedTextViewDelegateAdapter {
  __weak UITextView<ABI42_0_0RCTBackedTextInputViewProtocol> *_backedTextInputView;
  BOOL _textDidChangeIsComing;
  UITextRange *_previousSelectedTextRange;
}

- (instancetype)initWithTextView:(UITextView<ABI42_0_0RCTBackedTextInputViewProtocol> *)backedTextInputView
{
  if (self = [super init]) {
    _backedTextInputView = backedTextInputView;
    backedTextInputView.delegate = self;
  }

  return self;
}

#pragma mark - UITextViewDelegate

- (BOOL)textViewShouldBeginEditing:(__unused UITextView *)textView
{
  return [_backedTextInputView.textInputDelegate textInputShouldBeginEditing];
}

- (void)textViewDidBeginEditing:(__unused UITextView *)textView
{
  [_backedTextInputView.textInputDelegate textInputDidBeginEditing];
}

- (BOOL)textViewShouldEndEditing:(__unused UITextView *)textView
{
  return [_backedTextInputView.textInputDelegate textInputShouldEndEditing];
}

- (void)textViewDidEndEditing:(__unused UITextView *)textView
{
  if (_textDidChangeIsComing) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by losing focus. So, we call it manually.
    _textDidChangeIsComing = NO;
    [_backedTextInputView.textInputDelegate textInputDidChange];
  }

  [_backedTextInputView.textInputDelegate textInputDidEndEditing];
}

- (BOOL)textView:(__unused UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  // Custom implementation of `textInputShouldReturn` and `textInputDidReturn` pair for `UITextView`.
  if (!_backedTextInputView.textWasPasted && [text isEqualToString:@"\n"]) {
    if ([_backedTextInputView.textInputDelegate textInputShouldReturn]) {
      [_backedTextInputView.textInputDelegate textInputDidReturn];
      [_backedTextInputView endEditing:NO];
      return NO;
    }
  }

  NSString *newText =
    [_backedTextInputView.textInputDelegate textInputShouldChangeText:text inRange:range];

  if (newText == nil) {
    return NO;
  }

  if ([newText isEqualToString:text]) {
    _textDidChangeIsComing = YES;
    return YES;
  }

  NSMutableAttributedString *attributedString = [_backedTextInputView.attributedText mutableCopy];
  [attributedString replaceCharactersInRange:range withString:newText];
  [_backedTextInputView setAttributedText:[attributedString copy]];

  // Setting selection to the end of the replaced text.
  UITextPosition *position =
    [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                        offset:(range.location + newText.length)];
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                              notifyDelegate:YES];

  [self textViewDidChange:_backedTextInputView];

  return NO;
}

- (void)textViewDidChange:(__unused UITextView *)textView
{
  _textDidChangeIsComing = NO;
  [_backedTextInputView.textInputDelegate textInputDidChange];
}

- (void)textViewDidChangeSelection:(__unused UITextView *)textView
{
  [self textViewProbablyDidChangeSelection];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if ([_backedTextInputView.textInputDelegate respondsToSelector:@selector(scrollViewDidScroll:)]) {
    [_backedTextInputView.textInputDelegate scrollViewDidScroll:scrollView];
  }
}

#pragma mark - Public Interface

- (void)skipNextTextInputDidChangeSelectionEventWithTextRange:(UITextRange *)textRange
{
  _previousSelectedTextRange = textRange;
}

#pragma mark - Generalization

- (void)textViewProbablyDidChangeSelection
{
  if ([_backedTextInputView.selectedTextRange isEqual:_previousSelectedTextRange]) {
    return;
  }

  _previousSelectedTextRange = _backedTextInputView.selectedTextRange;
  [_backedTextInputView.textInputDelegate textInputDidChangeSelection];
}

@end
