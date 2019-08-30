//
//  GADMuteThisAdReason.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

/// Reason for muting the ad.
@interface GADMuteThisAdReason : NSObject

/// Text that describes the reason for muting this ad. For example "Ad Covered Content".
@property(nonatomic, readonly, nonnull) NSString *reasonDescription;

@end
