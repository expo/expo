//
//  TPSCardField.h
//  TPSStripe
//
//  Created by Anton Petrov on 01.11.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import <React/UIView+React.h>
#import <Stripe/Stripe.h>

@interface TPSCardField : UIView

@property (nonatomic, copy) RCTBubblingEventBlock onChange;
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
