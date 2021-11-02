/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>

#import "ABI43_0_0RCTVibrationPlugins.h"

@interface ABI43_0_0RCTVibration() <ABI43_0_0NativeVibrationSpec>
@end

@implementation ABI43_0_0RCTVibration

ABI43_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI43_0_0RCT_EXPORT_METHOD(vibrate:(double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:(const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeVibrationSpecJSI>(params);
}

ABI43_0_0RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(double)repeat)
{
  ABI43_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI43_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI43_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI43_0_0RCTVibrationCls(void)
{
  return ABI43_0_0RCTVibration.class;
}
