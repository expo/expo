/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTLog.h>

#import "ABI38_0_0RCTVibrationPlugins.h"

@interface ABI38_0_0RCTVibration() <NativeVibrationSpec>
@end

@implementation ABI38_0_0RCTVibration

ABI38_0_0RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

ABI38_0_0RCT_EXPORT_METHOD(vibrate:(double)pattern)
{
  [self vibrate];
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:
  (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeVibrationSpecJSI>(self, jsInvoker);
}

ABI38_0_0RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(double)repeat)
{
  ABI38_0_0RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

ABI38_0_0RCT_EXPORT_METHOD(cancel)
{
  ABI38_0_0RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class ABI38_0_0RCTVibrationCls(void)
{
  return ABI38_0_0RCTVibration.class;
}
