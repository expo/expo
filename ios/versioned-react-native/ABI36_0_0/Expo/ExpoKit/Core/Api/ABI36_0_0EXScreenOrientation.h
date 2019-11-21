// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>

#import "ABI36_0_0EXScopedEventEmitter.h"

typedef NS_ENUM(NSInteger, ABI36_0_0EXOrientation) {
    ABI36_0_0EXOrientationPortrait,
    ABI36_0_0EXOrientationPortraitUp,
    ABI36_0_0EXOrientationPortraitDown,
    ABI36_0_0EXOrientationLandscape,
    ABI36_0_0EXOrientationLandscapeLeft,
    ABI36_0_0EXOrientationLandscapeRight,
    ABI36_0_0EXOrientationUnknown
};

typedef NS_ENUM(NSInteger, ABI36_0_0EXOrientationLock) {
  ABI36_0_0EXOrientationDefaultLock,
  ABI36_0_0EXOrientationAllLock,
  ABI36_0_0EXOrientationPortraitLock,
  ABI36_0_0EXOrientationPortraitUpLock,
  ABI36_0_0EXOrientationPortraitDownLock,
  ABI36_0_0EXOrientationLandscapeLock,
  ABI36_0_0EXOrientationLandscapeLeftLock,
  ABI36_0_0EXOrientationLandscapeRightLock,
  ABI36_0_0EXOrientationOtherLock,
  ABI36_0_0EXOrientationAllButUpsideDownLock // deprecated
};

@interface ABI36_0_0RCTConvert (OrientationLock)

+ (ABI36_0_0EXOrientationLock)ABI36_0_0EXOrientationLock:(nullable id)json;

@end

@protocol ABI36_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(nonnull id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(nonnull NSString *)experienceId;

- (void)addOrientationChangeListener:(nonnull NSString *)experienceId subscriberModule:(nonnull id)subscriberModule;

- (nullable UITraitCollection *)getTraitCollection;

@end

@interface ABI36_0_0EXScreenOrientation : ABI36_0_0EXScopedEventEmitter <ABI36_0_0RCTBridgeModule>

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

+ (nonnull NSDictionary *)getStringToOrientationLockJSDict;
@end
