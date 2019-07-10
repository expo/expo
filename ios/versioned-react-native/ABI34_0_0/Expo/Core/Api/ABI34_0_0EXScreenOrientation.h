// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>

#import "ABI34_0_0EXScopedEventEmitter.h"

typedef NS_ENUM(NSInteger, ABI34_0_0EXOrientation) {
    ABI34_0_0EXOrientationPortrait,
    ABI34_0_0EXOrientationPortraitUp,
    ABI34_0_0EXOrientationPortraitDown,
    ABI34_0_0EXOrientationLandscape,
    ABI34_0_0EXOrientationLandscapeLeft,
    ABI34_0_0EXOrientationLandscapeRight,
    ABI34_0_0EXOrientationUnknown
};

typedef NS_ENUM(NSInteger, ABI34_0_0EXOrientationLock) {
  ABI34_0_0EXOrientationDefaultLock,
  ABI34_0_0EXOrientationAllLock,
  ABI34_0_0EXOrientationPortraitLock,
  ABI34_0_0EXOrientationPortraitUpLock,
  ABI34_0_0EXOrientationPortraitDownLock,
  ABI34_0_0EXOrientationLandscapeLock,
  ABI34_0_0EXOrientationLandscapeLeftLock,
  ABI34_0_0EXOrientationLandscapeRightLock,
  ABI34_0_0EXOrientationOtherLock,
  ABI34_0_0EXOrientationAllButUpsideDownLock // deprecated
};

@interface ABI34_0_0RCTConvert (OrientationLock)

+ (ABI34_0_0EXOrientationLock)ABI34_0_0EXOrientationLock:(nullable id)json;

@end

@protocol ABI34_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(nonnull id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(nonnull NSString *)experienceId;

- (void)addOrientationChangeListener:(nonnull NSString *)experienceId subscriberModule:(nonnull id)subscriberModule;

- (nullable UITraitCollection *)getTraitCollection;

@end

@interface ABI34_0_0EXScreenOrientation : ABI34_0_0EXScopedEventEmitter <ABI34_0_0RCTBridgeModule>

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

+ (nonnull NSDictionary *)getStringToOrientationLockJSDict;
@end
