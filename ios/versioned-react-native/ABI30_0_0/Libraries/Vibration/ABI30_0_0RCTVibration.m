/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTVibration.h"

#import <AudioToolbox/AudioToolbox.h>

@implementation ABI30_0_0RCTVibration

ABI30_0_0RCT_EXPORT_MODULE()

ABI30_0_0RCT_EXPORT_METHOD(vibrate)
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

@end
