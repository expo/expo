// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

@protocol EXAppContextProtocol;

#ifdef __cplusplus
#import <ReactCommon/RCTHost.h>
#endif

/**
 A wrapper around RCTHost. RCTHost isn't directly available in Swift.
 */
NS_SWIFT_NAME(ExpoHostWrapper)
@interface EXHostWrapper : NSObject

#ifdef __cplusplus
- (instancetype _Nonnull)initWithHost:(RCTHost * _Nonnull)host;
#endif

- (nullable UIView *)findViewWithTag:(NSInteger)tag;

- (nullable id)findModuleWithName:(nonnull NSString *)name lazilyLoadIfNecessary:(BOOL)lazilyLoadIfNecessary;

- (nullable NSURL *)bundleURL;

/**
 Notifies the app context when its host starts and finishes mounting views, so that the views
 created in between can be given that app context.
 */
- (void)observeMountingForAppContext:(nonnull id<EXAppContextProtocol>)appContext NS_SWIFT_NAME(observeMounting(for:));

@end

