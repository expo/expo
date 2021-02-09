//
//  GADInitializationStatus.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, GADAdapterInitializationState) {
  /// The mediation adapter is less likely to fill ad requests.
  GADAdapterInitializationStateNotReady = 0,
  /// The mediation adapter is ready to service ad requests.
  GADAdapterInitializationStateReady = 1
};

/// An immutable snapshot of a mediation adapter's initialization status.
@interface GADAdapterStatus : NSObject <NSCopying>

/// Initialization state of the adapter.
@property(nonatomic, readonly) GADAdapterInitializationState state;

/// Detailed description of the status.
@property(nonatomic, readonly, nonnull) NSString *description;

/// The adapter's initialization latency in seconds. 0 if initialization has not yet ended.
@property(nonatomic, readonly) NSTimeInterval latency;

@end

/// An immutable snapshot of the Google Mobile Ads SDK's initialization status, categorized by
/// mediation adapter.
@interface GADInitializationStatus : NSObject <NSCopying>
/// Initialization status of each ad network available to the Google Mobile Ads SDK, keyed by its
/// GADMAdapter's class name. The list of available ad networks may be incomplete during early
/// phases of SDK initialization.
@property(nonatomic, readonly, nonnull)
    NSDictionary<NSString *, GADAdapterStatus *> *adapterStatusesByClassName;
@end
