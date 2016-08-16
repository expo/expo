// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXFrame;

@interface EXFrameUtils : NSObject

- (instancetype)initWithFrame: (EXFrame *)frame;

@property (nonatomic, readonly) NSString *validatedVersion;

- (NSDictionary *)initialProperties;
- (NSString *)computedApplicationKey;
- (BOOL)doesManifestEnableDeveloperTools;
- (Class)versionedClassFromString: (NSString *)classString;
- (NSString *)versionedString: (NSString *)string;

+ (NSURL *)ensureUrlHasPort:(NSURL *)url;

@end
