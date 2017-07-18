// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

FOUNDATION_EXPORT NSString * const kEXShellBundleResourceName;
FOUNDATION_EXPORT NSString * const kEXShellManifestResourceName;

@interface EXShellManager : NSObject

+ (instancetype)sharedInstance;

@property (nonatomic, readonly) BOOL isShell;
@property (nonatomic, readonly) BOOL isDetached;

@property (nonatomic, readonly) NSString *shellManifestUrl;
@property (nonatomic, readonly) NSString *urlScheme;
@property (nonatomic, readonly) BOOL usesPublishedManifest;
@property (nonatomic, readonly) NSArray *allManifestUrls;
@property (nonatomic, readonly) BOOL isManifestVerificationBypassed;
@property (nonatomic, readonly) BOOL isRemoteJSEnabled;

/**
 *  True if the given string is not null and equals self.urlScheme
 */
- (BOOL)isShellUrlScheme: (NSString *)scheme;

/**
 *  True if urlScheme is nonnull.
 */
- (BOOL)hasUrlScheme;

@end
