/**
 @file          BNCError.m
 @package       Branch-SDK
 @brief         Branch errors.

 @author        Qinwei Gong
 @date          November 2014
 @copyright     Copyright © 2014 Branch. All rights reserved.
*/

#import "BNCError.h"
#import "BNCLocalization.h"

NSString * const BNCErrorDomain = @"io.branch.sdk.error";

__attribute__((constructor)) void BNCForceNSErrorCategoryToLoad() {
    // Nothing here, but forces linker to load the category.
}

@implementation NSError (Branch)

+ (NSString*) messageForCode:(BNCErrorCode)code {

    // The order is important!

    static NSString* const messages[] = {
    
        // BNCInitError
        @"The Branch user session has not been initialized.",

        // BNCDuplicateResourceError
        @"A resource with this identifier already exists.",
        
        // BNCRedeemCreditsError
        @"You're trying to redeem more credits than are available. Have you loaded rewards?",

        // BNCBadRequestError
        @"The network request was invalid.",

        // BNCServerProblemError
        @"Trouble reaching the Branch servers, please try again shortly.",

        // BNCNilLogError
        @"Can't log error messages because the logger is set to nil.",

        // BNCVersionError
        @"Incompatible version.",

        // BNCNetworkServiceInterfaceError
        @"The underlying network service does not conform to the BNCNetworkOperationProtocol.",

        // BNCInvalidNetworkPublicKeyError
        @"Public key is not an SecKeyRef type.",

        // BNCContentIdentifierError
        @"A canonical identifier or title are required to uniquely identify content.",

        // BNCSpotlightNotAvailableError
        @"The Core Spotlight indexing service is not available on this device.",
        
        // BNCSpotlightTitleError
        @"Spotlight indexing requires a title.",
        
        // BNCRedeemZeroCreditsError
        @"Can't redeem zero credits.",
        
        // BNCSpotlightIdentifierError
        @"The Spotlight identifier is required to remove indexing from spotlight.",
        
        //BNCSpotlightPublicIndexError
        @"Spotlight cannot remove publicly indexed content.",

        //BNCTrackingDisabledError
        @"User tracking is disabled."
    };

    #define _countof(array) (sizeof(array)/sizeof(array[0]))

    // Sanity check
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wunreachable-code"
    if (_countof(messages) != (BNCHighestError - BNCInitError)) {
        [NSException raise:NSInternalInconsistencyException format:@"Branch error message count is wrong."];
        return @"Branch encountered an error.";
    }
    #pragma clang diagnostic pop

    if (code < BNCInitError || code >= BNCHighestError)
        return @"Branch encountered an error.";

    return messages[code - BNCInitError];
}

+ (NSError*_Nonnull) branchErrorWithCode:(BNCErrorCode)errorCode
                           error:(NSError*)error
                localizedMessage:(NSString*_Nullable)message {

    NSMutableDictionary *userInfo = [NSMutableDictionary new];

    NSString *localizedString = BNCLocalizedString([self messageForCode:errorCode]);
    if (localizedString) userInfo[NSLocalizedDescriptionKey] = localizedString;
    if (message) {
        userInfo[NSLocalizedFailureReasonErrorKey] = message;
    }
    if (error) {
        userInfo[NSUnderlyingErrorKey] = error;
        if (!userInfo[NSLocalizedFailureReasonErrorKey] && error.localizedDescription)
            userInfo[NSLocalizedFailureReasonErrorKey] = error.localizedDescription;
    }

    return [NSError errorWithDomain:BNCErrorDomain code:errorCode userInfo:userInfo];
}

+ (NSError*_Nonnull) branchErrorWithCode:(BNCErrorCode)errorCode {
    return [NSError branchErrorWithCode:errorCode error:nil localizedMessage:nil];
}

+ (NSError*_Nonnull) branchErrorWithCode:(BNCErrorCode)errorCode error:(NSError*_Nullable)error {
    return [NSError branchErrorWithCode:errorCode error:error localizedMessage:nil];
}

+ (NSError*_Nonnull) branchErrorWithCode:(BNCErrorCode)errorCode localizedMessage:(NSString*_Nullable)message {
    return [NSError branchErrorWithCode:errorCode error:nil localizedMessage:message];
}

@end
