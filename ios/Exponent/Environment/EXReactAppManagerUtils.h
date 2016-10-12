// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXCachedResource.h"

@class EXReactAppManager;

@interface EXReactAppManagerUtils : NSObject

- (instancetype)initWithAppManager: (EXReactAppManager *)appManager;

@property (nonatomic, readonly) NSString *validatedVersion;

- (NSDictionary *)initialProperties;
- (NSString *)computedApplicationKey;
- (BOOL)doesManifestEnableDeveloperTools;

- (Class)versionedClassFromString: (NSString *)classString;
- (NSString *)versionedString: (NSString *)string;

- (EXCachedResourceBehavior)cacheBehaviorForJSResource;
- (NSString *)bundleNameForJSResource;

@end
