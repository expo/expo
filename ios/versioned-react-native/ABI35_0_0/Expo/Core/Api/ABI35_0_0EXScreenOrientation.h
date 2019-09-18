// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>

#import "ABI35_0_0EXScopedEventEmitter.h"

typedef NS_ENUM(NSInteger, ABI35_0_0EXOrientation) {
    ABI35_0_0EXOrientationPortrait,
    ABI35_0_0EXOrientationPortraitUp,
    ABI35_0_0EXOrientationPortraitDown,
    ABI35_0_0EXOrientationLandscape,
    ABI35_0_0EXOrientationLandscapeLeft,
    ABI35_0_0EXOrientationLandscapeRight,
    ABI35_0_0EXOrientationUnknown
};

typedef NS_ENUM(NSInteger, ABI35_0_0EXOrientationLock) {
  ABI35_0_0EXOrientationDefaultLock,
  ABI35_0_0EXOrientationAllLock,
  ABI35_0_0EXOrientationPortraitLock,
  ABI35_0_0EXOrientationPortraitUpLock,
  ABI35_0_0EXOrientationPortraitDownLock,
  ABI35_0_0EXOrientationLandscapeLock,
  ABI35_0_0EXOrientationLandscapeLeftLock,
  ABI35_0_0EXOrientationLandscapeRightLock,
  ABI35_0_0EXOrientationOtherLock,
  ABI35_0_0EXOrientationAllButUpsideDownLock // deprecated
};

@interface ABI35_0_0RCTConvert (OrientationLock)

+ (ABI35_0_0EXOrientationLock)ABI35_0_0EXOrientationLock:(nullable id)json;

@end

@protocol ABI35_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(nonnull id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(nonnull NSString *)experienceId;

- (void)addOrientationChangeListener:(nonnull NSString *)experienceId subscriberModule:(nonnull id)subscriberModule;

- (nullable UITraitCollection *)getTraitCollection;

@end

@interface ABI35_0_0EXScreenOrientation : ABI35_0_0EXScopedEventEmitter <ABI35_0_0RCTBridgeModule>

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

+ (nonnull NSDictionary *)getStringToOrientationLockJSDict;
@end
