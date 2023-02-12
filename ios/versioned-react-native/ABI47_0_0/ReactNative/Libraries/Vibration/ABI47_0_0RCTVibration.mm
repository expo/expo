/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI47_0_0FBReactNativeSpec/ABI47_0_0FBReactNativeSpec.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>

#import "ABI47_0_0RCTVibrationPlugins.h"

@interface ABI47_0_0RCTVibration() <ABI47_0_0NativeVibrationSpec>
@end

@implementation ABI47_0_0RCTVibration

ABI47_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI47_0_0RCT_EXPORT_METHOD(vibrate:(double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:(const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeVibrationSpecJSI>(params);
}

ABI47_0_0RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(double)repeat)
{
  ABI47_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI47_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI47_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI47_0_0RCTVibrationCls(void)
{
  return ABI47_0_0RCTVibration.class;
}
