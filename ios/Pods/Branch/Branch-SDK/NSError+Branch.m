/**
 @file          NSError+Branch.m
 @package       Branch-SDK
 @brief         Branch errors.

 @author        Qinwei Gong
 @date          November 2014
 @copyright     Copyright © 2014 Branch. All rights reserved.
*/

#import "NSError+Branch.h"
#import "BNCLocalization.h"

__attribute__((constructor)) void BNCForceNSErrorCategoryToLoad() {
    // Nothing here, but forces linker to load the category.
}

@implementation NSError (Branch)

+ (NSString *)bncErrorDomain {
    return @"io.branch.sdk.error";
}

// Legacy error messages
+ (NSString *) messageForCode:(BNCErrorCode)code {
    static NSMutableDictionary<NSNumber *, NSString *> *messages;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        messages = [NSMutableDictionary<NSNumber *, NSString *> new];
        [messages setObject:@"The Branch user session has not been initialized." forKey:@(BNCInitError)];
        [messages setObject:@"A resource with this identifier already exists." forKey:@(BNCDuplicateResourceError)];
        [messages setObject:@"You're trying to redeem more credits than are available. Have you loaded rewards?" forKey:@(BNCRedeemCreditsError)];
        [messages setObject:@"The network request was invalid." forKey:@(BNCBadRequestError)];
        [messages setObject:@"Trouble reaching the Branch servers, please try again shortly." forKey:@(BNCServerProblemError)];
        [messages setObject:@"Can't log error messages because the logger is set to nil." forKey:@(BNCNilLogError)];
        [messages setObject:@"Incompatible version." forKey:@(BNCVersionError)];
        [messages setObject:@"The underlying network service does not conform to the BNCNetworkOperationProtocol." forKey:@(BNCNetworkServiceInterfaceError)];
        [messages setObject:@"Public key is not an SecKeyRef type." forKey:@(BNCInvalidNetworkPublicKeyError)];
        [messages setObject:@"A canonical identifier or title are required to uniquely identify content." forKey:@(BNCContentIdentifierError)];
        [messages setObject:@"The Core Spotlight indexing service is not available on this device." forKey:@(BNCSpotlightNotAvailableError)];
        [messages setObject:@"Spotlight indexing requires a title." forKey:@(BNCSpotlightTitleError)];
        [messages setObject:@"Can't redeem zero credits." forKey:@(BNCRedeemZeroCreditsError)];
        [messages setObject:@"The Spotlight identifier is required to remove indexing from spotlight." forKey:@(BNCSpotlightIdentifierError)];
        [messages setObject:@"Spotlight cannot remove publicly indexed content." forKey:@(BNCSpotlightPublicIndexError)];
        [messages setObject:@"User tracking is disabled and the request is not on the whitelist" forKey:@(BNCTrackingDisabledError)];
    });
    
    NSString *errorMessage = [messages objectForKey:@(code)];
    if (!errorMessage) {
        errorMessage = @"Branch encountered an error.";
    }
    return errorMessage;
}

+ (NSError *) branchErrorWithCode:(BNCErrorCode)errorCode error:(NSError*)error localizedMessage:(NSString*_Nullable)message {
    NSMutableDictionary *userInfo = [NSMutableDictionary new];

    NSString *localizedString = BNCLocalizedString([self messageForCode:errorCode]);
    if (localizedString) {
        userInfo[NSLocalizedDescriptionKey] = localizedString;
    }
    
    if (message) {
        userInfo[NSLocalizedFailureReasonErrorKey] = message;
    }
    
    if (error) {
        userInfo[NSUnderlyingErrorKey] = error;
        if (!userInfo[NSLocalizedFailureReasonErrorKey] && error.localizedDescription) {
            userInfo[NSLocalizedFailureReasonErrorKey] = error.localizedDescription;
        }
    }

    return [NSError errorWithDomain:[self bncErrorDomain] code:errorCode userInfo:userInfo];
}

+ (NSError *) branchErrorWithCode:(BNCErrorCode)errorCode {
    return [NSError branchErrorWithCode:errorCode error:nil localizedMessage:nil];
}

+ (NSError *) branchErrorWithCode:(BNCErrorCode)errorCode error:(NSError *_Nullable)error {
    return [NSError branchErrorWithCode:errorCode error:error localizedMessage:nil];
}

+ (NSError *) branchErrorWithCode:(BNCErrorCode)errorCode localizedMessage:(NSString *_Nullable)message {
    return [NSError branchErrorWithCode:errorCode error:nil localizedMessage:message];
}

@end
