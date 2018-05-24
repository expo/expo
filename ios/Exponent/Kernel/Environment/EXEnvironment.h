// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXTest.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const kEXEmbeddedBundleResourceName;
FOUNDATION_EXPORT NSString * const kEXEmbeddedManifestResourceName;

@interface EXEnvironment : NSObject

+ (instancetype)sharedEnvironment;

@property (nonatomic, readonly) BOOL isDetached;
@property (nonatomic, readonly) BOOL isDebugXCodeScheme;

@property (nonatomic, readonly, nullable) NSString *standaloneManifestUrl;
@property (nonatomic, readonly, nullable) NSString *urlScheme;
@property (nonatomic, readonly, nonnull) NSString *releaseChannel;
@property (nonatomic, readonly) NSString * _Nullable embeddedBundleUrl;
@property (nonatomic, readonly, nonnull) NSArray *allManifestUrls;
@property (nonatomic, readonly) BOOL isManifestVerificationBypassed;
@property (nonatomic, readonly) BOOL areRemoteUpdatesEnabled;
@property (nonatomic, assign) EXTestEnvironment testEnvironment;

/**
 *  True if the given string is not null and equals self.urlScheme
 */
- (BOOL)isStandaloneUrlScheme:(NSString *)scheme;

/**
 *  True if urlScheme is nonnull.
 */
- (BOOL)hasUrlScheme;

@end

NS_ASSUME_NONNULL_END
