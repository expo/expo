/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI44_0_0FBReactNativeSpec/ABI44_0_0FBReactNativeSpec.h>
#import <ABI44_0_0React/ABI44_0_0RCTLog.h>

#import "ABI44_0_0RCTVibrationPlugins.h"

@interface ABI44_0_0RCTVibration() <ABI44_0_0NativeVibrationSpec>
@end

@implementation ABI44_0_0RCTVibration

ABI44_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI44_0_0RCT_EXPORT_METHOD(vibrate:(double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::TurboModule>)getTurboModule:(const ABI44_0_0facebook::ABI44_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI44_0_0facebook::ABI44_0_0React::NativeVibrationSpecJSI>(params);
}

ABI44_0_0RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(double)repeat)
{
  ABI44_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI44_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI44_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI44_0_0RCTVibrationCls(void)
{
  return ABI44_0_0RCTVibration.class;
}
