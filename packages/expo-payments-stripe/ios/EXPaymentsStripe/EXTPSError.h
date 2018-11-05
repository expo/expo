//
//  TPSError.h
//  TPSStripe
//
//  Created by Dmytro Zavgorodniy on 10/18/17.
//  Copyright © 2017 Tipsi. All rights reserved.
//

#import <Foundation/Foundation.h>

extern NSString *const TPSErrorDomain;

typedef NS_ENUM(NSInteger, TPSErrorCode)
{
    /// Apple Pay is not configured.
    TPSErrorCodeApplePayNotConfigured = -1,

    /// Previous request is not completed.
    TPSErrorCodePreviousRequestNotCompleted = -2,
    
    /// Canceled by user.
    TPSErrorCodeUserCancel = -3,
};

@interface EXTPSError : NSObject

+ (NSError *)applePayNotConfiguredError;

+ (NSError *)previousRequestNotCompletedError;

+ (NSError *)userCancelError;

@end
