/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>

#import "ABI49_0_0RCTVibrationPlugins.h"

@interface ABI49_0_0RCTVibration () <ABI49_0_0NativeVibrationSpec>
@end

@implementation ABI49_0_0RCTVibration

ABI49_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI49_0_0RCT_EXPORT_METHOD(vibrate : (double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeVibrationSpecJSI>(params);
}

ABI49_0_0RCT_EXPORT_METHOD(vibrateByPattern : (NSArray *)pattern repeat : (double)repeat)
{
  ABI49_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI49_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI49_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI49_0_0RCTVibrationCls(void)
{
  return ABI49_0_0RCTVibration.class;
}
