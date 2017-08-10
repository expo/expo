//
//  ABI20_0_0TPSCardField.h
//  ABI20_0_0TPSStripe
//
//  Created by Anton Petrov on 01.11.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import <Stripe/Stripe.h>

@interface ABI20_0_0TPSCardField : UIView

@property (nonatomic, copy) ABI20_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, strong) UIFont *font;
@property(nonatomic, strong) UIColor *textColor;
@property(nonatomic, strong) UIColor *textErrorColor;
@property(nonatomic, strong) UIColor *placeholderColor;
@property(nonatomic, copy) NSString *numberPlaceholder;
@property(nonatomic, copy) NSString *expirationPlaceholder;
@property(nonatomic, copy) NSString *cvcPlaceholder;
@property(nonatomic, strong) UIColor *cursorColor;
@property(nonatomic, strong) UIColor *borderColor;
@property(nonatomic, assign) CGFloat borderWidth;
@property(nonatomic, assign) CGFloat cornerRadius;
- (void)setCardParams:(STPCardParams *)cardParams;

@end
