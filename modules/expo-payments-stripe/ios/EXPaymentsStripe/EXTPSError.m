//
//  TPSError.m
//  TPSStripe
//
//  Created by Dmytro Zavgorodniy on 10/18/17.
//  Copyright © 2017 Tipsi. All rights reserved.
//

#import <EXPaymentsStripe/EXTPSError.h>

NSString * const TPSErrorDomain = @"com.tipsi.TPSStripe";

@implementation EXTPSError

#pragma mark - Class Methods

+ (NSError *)applePayNotConfiguredError {
    return [NSError
            errorWithDomain:TPSErrorDomain
            code:TPSErrorCodeApplePayNotConfigured
            userInfo:@{NSLocalizedDescriptionKey: @"Apple Pay is not configured"}];
}

+ (NSError *)previousRequestNotCompletedError {
    return [NSError
            errorWithDomain:TPSErrorDomain
            code:TPSErrorCodePreviousRequestNotCompleted
            userInfo:@{NSLocalizedDescriptionKey: @"Previous request is not completed"}];
}

+ (NSError *)userCancelError {
    return [NSError
            errorWithDomain:TPSErrorDomain
            code:TPSErrorCodeUserCancel
            userInfo:@{NSLocalizedDescriptionKey: @"Canceled by user"}];
}

@end
