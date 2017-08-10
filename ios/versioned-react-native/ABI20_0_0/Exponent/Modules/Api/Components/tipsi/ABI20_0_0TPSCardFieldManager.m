//
//  ABI20_0_0TPSCardFieldManager.m
//  ABI20_0_0TPSStripe
//
//  Created by Anton Petrov on 01.11.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import "ABI20_0_0TPSCardFieldManager.h"
#import "ABI20_0_0TPSCardField.h"
#import <ReactABI20_0_0/ABI20_0_0RCTFont.h>

@implementation ABI20_0_0TPSCardFieldManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI20_0_0TPSCardField new];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(borderColor, UIColor);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(borderWidth, CGFloat);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(cornerRadius, CGFloat);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(cursorColor, UIColor);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(textErrorColor, UIColor);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(placeholderColor, UIColor);

ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI20_0_0TPSCardField)
{
    view.font = [ABI20_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI20_0_0TPSCardField)
{
    view.font = [ABI20_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI20_0_0TPSCardField)
{
    view.font = [ABI20_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI20_0_0TPSCardField)
{
    view.font = [ABI20_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(numberPlaceholder, NSString);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(expirationPlaceholder, NSString);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(cvcPlaceholder, NSString);

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL);

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI20_0_0RCTBubblingEventBlock);

ABI20_0_0RCT_CUSTOM_VIEW_PROPERTY(params, NSDictionary, ABI20_0_0TPSCardField)
{
    STPCardParams *cardParams = [[STPCardParams alloc] init];

    [cardParams setValuesForKeysWithDictionary:json];

    [view setCardParams:cardParams];
}


@end
