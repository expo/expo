//
//  EXCameraUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "EXCameraUtils.h"

@implementation EXCameraUtils

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

+ (float)temperatureForWhiteBalance:(EXCameraWhiteBalance)whiteBalance
{
  switch (whiteBalance) {
    case EXCameraWhiteBalanceSunny: default:
      return 5200;
    case EXCameraWhiteBalanceCloudy:
      return 6000;
    case EXCameraWhiteBalanceShadow:
      return 7000;
    case EXCameraWhiteBalanceIncandescent:
      return 3000;
    case EXCameraWhiteBalanceFluorescent:
      return 4200;
  }
}

+ (NSString *)captureSessionPresetForVideoResolution:(EXCameraVideoResolution)resolution
{
  switch (resolution) {
    case EXCameraVideo2160p:
      return AVCaptureSessionPreset3840x2160;
    case EXCameraVideo1080p:
      return AVCaptureSessionPreset1920x1080;
    case EXCameraVideo720p:
      return AVCaptureSessionPreset1280x720;
    case EXCameraVideo4x3:
      return AVCaptureSessionPreset640x480;
    default:
      return AVCaptureSessionPresetHigh;
  }
}

@end
