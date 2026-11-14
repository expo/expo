// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Stores response body previews in React Native's core network reporter on behalf of `ExpoNetworkReporter`.
 */
@interface EXNetworkReporterBodyStore : NSObject

/**
 Stores a text body through `maybeStoreResponseBody`, whose implementation takes an `NSString` even though
 its header types the argument as `NSData`.
 */
+ (void)storeTextResponseBody:(NSString *)text forRequestId:(NSString *)requestId;

@end

NS_ASSUME_NONNULL_END
