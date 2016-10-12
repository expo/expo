// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXCachedResource.h"

@class EXFrame;

@interface EXReactAppManagerUtils : NSObject

- (instancetype)initWithFrame:(EXFrame *)frame isKernel:(BOOL)isKernel;

@property (nonatomic, readonly) NSString *validatedVersion;

- (NSDictionary *)initialProperties;
- (NSString *)computedApplicationKey;
- (BOOL)doesManifestEnableDeveloperTools;
- (Class)versionedClassFromString: (NSString *)classString;
- (NSString *)versionedString: (NSString *)string;
- (EXCachedResourceBehavior)cacheBehaviorForJSResource;

@end
