//
//  ABI49_0_0EXCameraUtils.h
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI49_0_0EXCamera/ABI49_0_0EXCamera.h>

@interface ABI49_0_0EXCameraUtils : NSObject

// Camera utilities
+ (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType preferringPosition:(AVCaptureDevicePosition)position;
+ (UIDeviceOrientation)deviceOrientationForAccelerometerData:(CMAccelerometerData*)accelerometerData defaultOrientation:(UIDeviceOrientation)orientation;

// Enum conversions
+ (float)temperatureForWhiteBalance:(ABI49_0_0EXCameraWhiteBalance)whiteBalance;
+ (NSString *)captureSessionPresetForVideoResolution:(ABI49_0_0EXCameraVideoResolution)resolution;
+ (AVCaptureVideoOrientation)videoOrientationForDeviceOrientation:(UIDeviceOrientation)orientation;
+ (AVCaptureVideoOrientation)videoOrientationForInterfaceOrientation:(UIInterfaceOrientation)orientation;
+ (int)exportImageOrientation:(UIImageOrientation)orientation;
+ (AVVideoCodecType)videoCodecForType:(ABI49_0_0EXCameraVideoCodec)videoCodecType;

// Image utilities
+ (nonnull UIImage *)generatePhotoOfSize:(CGSize)size;
+ (UIImage *)cropImage:(UIImage *)image toRect:(CGRect)rect;
+ (nonnull NSString *)writeImage:(NSData *)image toPath:(NSString *)path;
+ (NSMutableDictionary *)updateExifMetadata:(NSDictionary *)metadata withAdditionalData:(NSDictionary *)additionalData;
+ (NSData *)dataFromImage:(UIImage *)image withMetadata:(NSDictionary *)exif imageQuality:(float)quality;

@end
