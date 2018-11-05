//
//  ABI28_0_0EXCameraUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "ABI28_0_0EXCameraUtils.h"

@implementation ABI28_0_0EXCameraUtils

# pragma mark - Camera utilities

+ (AVCaptureDevice *)deviceWithMediaType:(AVMediaType)mediaType preferringPosition:(AVCaptureDevicePosition)position
{
  NSArray *devices = [AVCaptureDevice devicesWithMediaType:mediaType];
  AVCaptureDevice *captureDevice = [devices firstObject];
  
  for (AVCaptureDevice *device in devices) {
    if ([device position] == position) {
      captureDevice = device;
      break;
    }
  }
  
  return captureDevice;
}

# pragma mark - Enum conversion

+ (AVCaptureVideoOrientation)videoOrientationForInterfaceOrientation:(UIInterfaceOrientation)orientation
{
  switch (orientation) {
    case UIInterfaceOrientationPortrait:
      return AVCaptureVideoOrientationPortrait;
    case UIInterfaceOrientationPortraitUpsideDown:
      return AVCaptureVideoOrientationPortraitUpsideDown;
    case UIInterfaceOrientationLandscapeRight:
      return AVCaptureVideoOrientationLandscapeRight;
    case UIInterfaceOrientationLandscapeLeft:
      return AVCaptureVideoOrientationLandscapeLeft;
    default:
      return 0;
  }
}

+ (AVCaptureVideoOrientation)videoOrientationForDeviceOrientation:(UIDeviceOrientation)orientation
{
  switch (orientation) {
    case UIDeviceOrientationPortrait:
      return AVCaptureVideoOrientationPortrait;
    case UIDeviceOrientationPortraitUpsideDown:
      return AVCaptureVideoOrientationPortraitUpsideDown;
    case UIDeviceOrientationLandscapeLeft:
      return AVCaptureVideoOrientationLandscapeRight;
    case UIDeviceOrientationLandscapeRight:
      return AVCaptureVideoOrientationLandscapeLeft;
    default:
      return AVCaptureVideoOrientationPortrait;
  }
}

+ (float)temperatureForWhiteBalance:(ABI28_0_0EXCameraWhiteBalance)whiteBalance
{
  switch (whiteBalance) {
    case ABI28_0_0EXCameraWhiteBalanceSunny: default:
      return 5200;
    case ABI28_0_0EXCameraWhiteBalanceCloudy:
      return 6000;
    case ABI28_0_0EXCameraWhiteBalanceShadow:
      return 7000;
    case ABI28_0_0EXCameraWhiteBalanceIncandescent:
      return 3000;
    case ABI28_0_0EXCameraWhiteBalanceFluorescent:
      return 4200;
  }
}

+ (NSString *)captureSessionPresetForVideoResolution:(ABI28_0_0EXCameraVideoResolution)resolution
{
  switch (resolution) {
    case ABI28_0_0EXCameraVideo2160p:
      return AVCaptureSessionPreset3840x2160;
    case ABI28_0_0EXCameraVideo1080p:
      return AVCaptureSessionPreset1920x1080;
    case ABI28_0_0EXCameraVideo720p:
      return AVCaptureSessionPreset1280x720;
    case ABI28_0_0EXCameraVideo4x3:
      return AVCaptureSessionPreset640x480;
    default:
      return AVCaptureSessionPresetHigh;
  }
}

@end
