/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTUITextField.h>

#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>

#import <ABI37_0_0React/ABI37_0_0RCTBackedTextInputDelegateAdapter.h>
#import <ABI37_0_0React/ABI37_0_0RCTTextAttributes.h>

@implementation ABI37_0_0RCTUITextField {
  ABI37_0_0RCTBackedTextFieldDelegateAdapter *_textInputDelegateAdapter;
}

@synthesize ABI37_0_0ReactTextAttributes = _ABI37_0_0ReactTextAttributes;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];

    _textInputDelegateAdapter = [[ABI37_0_0RCTBackedTextFieldDelegateAdapter alloc] initWithTextField:self];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)_textDidChange
{
  _textWasPasted = NO;
}

#pragma mark - Accessibility

- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
{
  // UITextField is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented inside the component.
}

#pragma mark - Properties

- (void)setTextContainerInset:(UIEdgeInsets)textContainerInset
{
  _textContainerInset = textContainerInset;
  [self setNeedsLayout];
}

- (void)setPlaceholder:(NSString *)placeholder
{
  [super setPlaceholder:placeholder];
  [self _updatePlaceholder];
}

- (void)setPlaceholderColor:(UIColor *)placeholderColor
{
  _placeholderColor = placeholderColor;
  [self _updatePlaceholder];
}

- (void)setABI37_0_0ReactTextAttributes:(ABI37_0_0RCTTextAttributes *)ABI37_0_0ReactTextAttributes
{
  if ([ABI37_0_0ReactTextAttributes isEqual:_ABI37_0_0ReactTextAttributes]) {
    return;
  }
  self.defaultTextAttributes = ABI37_0_0ReactTextAttributes.effectiveTextAttributes;
  _ABI37_0_0ReactTextAttributes = ABI37_0_0ReactTextAttributes;
  [self _updatePlaceholder];
}

- (ABI37_0_0RCTTextAttributes *)ABI37_0_0ReactTextAttributes
{
  return _ABI37_0_0ReactTextAttributes;
}

- (void)_updatePlaceholder
{
  if (self.placeholder == nil) {
    return;
  }

  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder
                                                               attributes:[self placeholderEffectiveTextAttributes]];
}

- (BOOL)isEditable
{
  return self.isEnabled;
}

- (void)setEditable:(BOOL)editable
{
  self.enabled = editable;
}

- (void)setScrollEnabled:(BOOL)enabled
{
  // Do noting, compatible with multiline textinput
}

- (BOOL)scrollEnabled
{
  return NO;
}

#pragma mark - Placeholder

- (NSDictionary<NSAttributedStringKey, id> *)placeholderEffectiveTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *effectiveTextAttributes = [NSMutableDictionary dictionary];
  
  if (_placeholderColor) {
    effectiveTextAttributes[NSForegroundColorAttributeName] = _placeholderColor;
  }
  // Kerning
  if (!isnan(_ABI37_0_0ReactTextAttributes.letterSpacing)) {
    effectiveTextAttributes[NSKernAttributeName] = @(_ABI37_0_0ReactTextAttributes.letterSpacing);
  }
  
  NSParagraphStyle *paragraphStyle = [_ABI37_0_0ReactTextAttributes effectiveParagraphStyle];
  if (paragraphStyle) {
    effectiveTextAttributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }
  
  return [effectiveTextAttributes copy];
}

#pragma mark - Context Menu

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_contextMenuHidden) {
    return NO;
  }

  return [super canPerformAction:action withSender:sender];
}

#pragma mark - Caret Manipulation

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}


#pragma mark - Positioning Overrides

- (CGRect)textRectForBounds:(CGRect)bounds
{
  return UIEdgeInsetsInsetRect([super textRectForBounds:bounds], _textContainerInset);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

#pragma mark - Overrides

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// Overrides selectedTextRange setter to get notify when selectedTextRange changed.
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange
{
  [super setSelectedTextRange:selectedTextRange];
  [_textInputDelegateAdapter selectedTextRangeWasSet];
}
#pragma clang diagnostic pop

- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

  [super setSelectedTextRange:selectedTextRange];
}

- (void)paste:(id)sender
{
  [super paste:sender];
  _textWasPasted = YES;
}

#pragma mark - Layout

- (CGSize)contentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return self.intrinsicContentSize;
}

- (CGSize)intrinsicContentSize
{
  // Note: `placeholder` defines intrinsic size for `<TextInput>`.
  NSString *text = self.placeholder ?: @"";
  CGSize size = [text sizeWithAttributes:[self placeholderEffectiveTextAttributes]];
  size = CGSizeMake(ABI37_0_0RCTCeilPixelValue(size.width), ABI37_0_0RCTCeilPixelValue(size.height));
  size.width += _textContainerInset.left + _textContainerInset.right;
  size.height += _textContainerInset.top + _textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // All size values here contain `textContainerInset` (aka `padding`).
  CGSize intrinsicSize = self.intrinsicContentSize;
  return CGSizeMake(MIN(size.width, intrinsicSize.width), MIN(size.height, intrinsicSize.height));
}

@end
