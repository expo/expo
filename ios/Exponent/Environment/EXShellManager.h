// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

FOUNDATION_EXPORT NSString * const kEXShellBundleResourceName;
FOUNDATION_EXPORT NSString * const kEXShellManifestResourceName;

@interface EXShellManager : NSObject

+ (instancetype)sharedInstance;

@property (nonatomic, readonly) BOOL isShell;
@property (nonatomic, readonly) NSString *shellManifestUrl;
@property (nonatomic, readonly) NSString *urlScheme;
@property (nonatomic, readonly) NSString *devUrlScheme;
@property (nonatomic, readonly) NSArray *allManifestUrls;

/**
 *  True if the given string is not null and equals self.urlScheme or self.devUrlScheme 
 */
- (BOOL)isShellUrlScheme: (NSString *)scheme;

/**
 *  True if either urlScheme or devUrlScheme is nonnull.
 */
- (BOOL)hasUrlScheme;

@end
