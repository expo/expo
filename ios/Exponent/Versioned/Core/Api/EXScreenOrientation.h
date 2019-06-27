// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>

#import "EXScopedEventEmitter.h"

typedef NS_ENUM(NSInteger, EXOrientation) {
    EXOrientationPortrait,
    EXOrientationPortraitUp,
    EXOrientationPortraitDown,
    EXOrientationLandscape,
    EXOrientationLandscapeLeft,
    EXOrientationLandscapeRight,
    EXOrientationUnknown
};

typedef NS_ENUM(NSInteger, EXOrientationLock) {
  EXOrientationDefaultLock,
  EXOrientationAllLock,
  EXOrientationPortraitLock,
  EXOrientationPortraitUpLock,
  EXOrientationPortraitDownLock,
  EXOrientationLandscapeLock,
  EXOrientationLandscapeLeftLock,
  EXOrientationLandscapeRightLock,
  EXOrientationOtherLock,
  EXOrientationAllButUpsideDownLock // deprecated
};

@interface RCTConvert (OrientationLock)

+ (EXOrientationLock)EXOrientationLock:(nullable id)json;

@end

@protocol EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(nonnull id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(nonnull NSString *)experienceId;

- (void)addOrientationChangeListener:(nonnull NSString *)experienceId subscriberModule:(nonnull id)subscriberModule;

- (nullable UITraitCollection *)getTraitCollection;

@end

@interface EXScreenOrientation : EXScopedEventEmitter <RCTBridgeModule>

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

+ (nonnull NSDictionary *)getStringToOrientationLockJSDict;
@end
