// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXReactAppManager.h"

#import <React/RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTSource (EXReactAppManager)

- (instancetype)initWithURL:(nonnull NSURL *)url data:(nonnull NSData *)data;

@end

@interface EXReactAppManager ()

@property (nonatomic, strong) NSString *versionSymbolPrefix;
@property (nonatomic, strong, nullable) NSString *validatedVersion;

// versioned
@property (nonatomic, strong) id versionManager;

- (BOOL)isReadyToLoad;

- (void)computeVersionSymbolPrefix;

- (NSString *)bundleNameForJSResource;
- (EXCachedResourceBehavior)cacheBehaviorForJSResource;
- (BOOL)shouldInvalidateJSResourceCache;

- (NSDictionary * _Nullable)launchOptionsForBridge;
- (NSDictionary * _Nullable)initialPropertiesForRootView;
- (NSString *)applicationKeyForRootView;

- (RCTLogFunction)logFunction;
- (RCTLogLevel)logLevel;

- (void)registerBridge;
- (void)unregisterBridge;

- (Class)versionedClassFromString: (NSString *)classString;
- (NSString *)versionedString: (NSString *)string;
- (NSComparisonResult)compareVersionTo:(NSUInteger)version;

@end

NS_ASSUME_NONNULL_END
