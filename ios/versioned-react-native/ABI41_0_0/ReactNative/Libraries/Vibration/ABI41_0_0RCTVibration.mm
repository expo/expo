/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI41_0_0FBReactNativeSpec/ABI41_0_0FBReactNativeSpec.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

#import "ABI41_0_0RCTVibrationPlugins.h"

@interface ABI41_0_0RCTVibration() <ABI41_0_0NativeVibrationSpec>
@end

@implementation ABI41_0_0RCTVibration

ABI41_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI41_0_0RCT_EXPORT_METHOD(vibrate:(double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI41_0_0facebook::ABI41_0_0React::NativeVibrationSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

ABI41_0_0RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(double)repeat)
{
  ABI41_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI41_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI41_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI41_0_0RCTVibrationCls(void)
{
  return ABI41_0_0RCTVibration.class;
}
