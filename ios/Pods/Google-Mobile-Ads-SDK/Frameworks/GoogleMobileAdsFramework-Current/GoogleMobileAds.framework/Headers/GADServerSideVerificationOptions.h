//
//  GADServerSideVerificationOptions.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

/// Options for server-side verification callbacks for a rewarded ad.
@interface GADServerSideVerificationOptions : NSObject <NSCopying>

/// A unique identifier used to identify the user when making server-side verification reward
/// callbacks. This value will be passed as a parameter of the callback URL to the publisher's
/// server.
@property(nonatomic, copy, nullable) NSString *userIdentifier;

/// Optional custom reward string to include in the server-side verification callback.
@property(nonatomic, copy, nullable) NSString *customRewardString;

@end
