/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

#import "ABI42_0_0RCTVibrationPlugins.h"

@interface ABI42_0_0RCTVibration() <ABI42_0_0NativeVibrationSpec>
@end

@implementation ABI42_0_0RCTVibration

ABI42_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI42_0_0RCT_EXPORT_METHOD(vibrate:(double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI42_0_0facebook::ABI42_0_0React::NativeVibrationSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

ABI42_0_0RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(double)repeat)
{
  ABI42_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI42_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI42_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI42_0_0RCTVibrationCls(void)
{
  return ABI42_0_0RCTVibration.class;
}
