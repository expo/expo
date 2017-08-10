//
//  ABI20_0_0TPSCardField.m
//  ABI20_0_0TPSStripe
//
//  Created by Anton Petrov on 01.11.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import "ABI20_0_0TPSCardField.h"

@interface ABI20_0_0TPSCardField () <STPPaymentCardTextFieldDelegate>
@end

@implementation ABI20_0_0TPSCardField {
    BOOL _jsRequestingFirstResponder;
    BOOL _isFirstResponder;
    STPPaymentCardTextField *_paymentCardTextField;

}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:self.window];
}

- (instancetype)initWithFrame:(CGRect)frame {
    if ((self = [super initWithFrame:frame])) {
        _isFirstResponder = NO;
        _paymentCardTextField = [[STPPaymentCardTextField alloc] initWithFrame:self.bounds];
        _paymentCardTextField.delegate = self;
        [self addSubview:_paymentCardTextField];
        self.backgroundColor = [UIColor clearColor];
        [[NSNotificationCenter defaultCenter]
            addObserver:self
               selector:@selector(keyboardWillShow:)
                   name:UIKeyboardWillShowNotification
                 object:self.window];
    }
    return self;
}

- (void)ReactABI20_0_0SetFrame:(CGRect)frame {
    [super ReactABI20_0_0SetFrame:frame];
    _paymentCardTextField.frame = self.bounds;
}

- (void)ReactABI20_0_0WillMakeFirstResponder {
    _jsRequestingFirstResponder = YES;
}

- (BOOL)canBecomeFirstResponder {
    return _jsRequestingFirstResponder;
}

- (void)ReactABI20_0_0DidMakeFirstResponder {
    _jsRequestingFirstResponder = NO;
}

- (void)didMoveToWindow {
    if (_jsRequestingFirstResponder) {
        [_paymentCardTextField becomeFirstResponder];
        [self ReactABI20_0_0DidMakeFirstResponder];
    }
}

- (void)keyboardWillShow:(NSNotification *)n {
    if (!_jsRequestingFirstResponder && !_isFirstResponder) {
        [_paymentCardTextField resignFirstResponder];
    }
}

- (BOOL)becomeFirstResponder {
    _isFirstResponder = YES;
    return [_paymentCardTextField becomeFirstResponder];
}

- (BOOL)resignFirstResponder {
    _isFirstResponder = NO;
    return [_paymentCardTextField resignFirstResponder];
}

#pragma mark -

- (UIFont *)font {
    return _paymentCardTextField.font;
}

- (void)setFont:(UIFont*)font {
    _paymentCardTextField.font = font;
}

- (UIColor *)textColor {
    return _paymentCardTextField.textColor;
}

- (void)setTextColor:(UIColor *)textColor {
    _paymentCardTextField.textColor = textColor;
}

- (UIColor *)borderColor {
    return _paymentCardTextField.borderColor;
}

- (void)setBorderColor:(UIColor *)borderColor {
    _paymentCardTextField.borderColor = borderColor;
}

- (CGFloat)borderWidth {
    return _paymentCardTextField.borderWidth;
}

- (void)setBorderWidth:(CGFloat)borderWidth {
    _paymentCardTextField.borderWidth = borderWidth;
}

- (CGFloat)cornerRadius {
    return _paymentCardTextField.cornerRadius;
}

- (void)setCornerRadius:(CGFloat)cornerRadius {
    _paymentCardTextField.cornerRadius = cornerRadius;
}

- (UIColor *)cursorColor {
    return _paymentCardTextField.cursorColor;
}

- (void)setCursorColor:(UIColor *)cursorColor {
    _paymentCardTextField.cursorColor = cursorColor;
}

- (UIColor *)textErrorColor {
    return _paymentCardTextField.textErrorColor;
}

- (void)setTextErrorColor:(UIColor *)textErrorColor {
    _paymentCardTextField.textErrorColor = textErrorColor;
}

- (UIColor *)placeholderColor {
    return _paymentCardTextField.placeholderColor;
}

- (void)setPlaceholderColor:(UIColor *)placeholderColor {
    _paymentCardTextField.placeholderColor = placeholderColor;
}

- (void)setCardParams:(STPCardParams *)cardParams {
    // Remove delegate before update paymentCardTextField with prefilled card
    // for preventing call paymentCardTextFieldDidChange for every fields
    _paymentCardTextField.delegate = nil;
    [_paymentCardTextField setCardParams:cardParams];
    _paymentCardTextField.delegate = self;
    // call paymentCardTextFieldDidChange for update ABI20_0_0RN
    [self paymentCardTextFieldDidChange:nil];
}

#pragma mark - STPPaymentCardTextFieldDelegate

- (void)paymentCardTextFieldDidChange:(STPPaymentCardTextField *)textField {
    if (!_onChange) {
        return;
    }
    _onChange(@{
                @"valid": @(_paymentCardTextField.isValid),
                @"params": @{
                        @"number": _paymentCardTextField.cardParams.number?:@"",
                        @"expMonth": @(_paymentCardTextField.cardParams.expMonth),
                        @"expYear": @(_paymentCardTextField.cardParams.expYear),
                        @"cvc": _paymentCardTextField.cardParams.cvc?:@""
                        }
                });
}

@end
