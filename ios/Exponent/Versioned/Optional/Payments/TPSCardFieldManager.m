//
//  TPSCardFieldManager.m
//  TPSStripe
//
//  Created by Anton Petrov on 01.11.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import "TPSCardFieldManager.h"
#import "TPSCardField.h"
#import <React/RCTFont.h>

@implementation TPSCardFieldManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [TPSCardField new];
}

RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(borderColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(borderWidth, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(cursorColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(textErrorColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(placeholderColor, UIColor);

RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, TPSCardField)
{
    view.font = [RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused TPSCardField)
{
    view.font = [RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused TPSCardField)
{
    view.font = [RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, TPSCardField)
{
    view.font = [RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

RCT_EXPORT_VIEW_PROPERTY(numberPlaceholder, NSString);
RCT_EXPORT_VIEW_PROPERTY(expirationPlaceholder, NSString);
RCT_EXPORT_VIEW_PROPERTY(cvcPlaceholder, NSString);

RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL);

RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock);

RCT_CUSTOM_VIEW_PROPERTY(params, NSDictionary, TPSCardField)
{
    STPCardParams *cardParams = [[STPCardParams alloc] init];

    [cardParams setValuesForKeysWithDictionary:json];

    [view setCardParams:cardParams];
}


@end
