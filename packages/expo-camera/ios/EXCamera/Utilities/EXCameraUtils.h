//
//  EXCameraUtils.h
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <EXCamera/EXCamera.h>

@interface EXCameraUtils : NSObject

// Camera utilities
+ (AVCaptureDevice *)deviceWithMediaType:(NSString *)mediaType preferringPosition:(AVCaptureDevicePosition)position;

// Enum conversions
+ (float)temperatureForWhiteBalance:(EXCameraWhiteBalance)whiteBalance;
+ (NSString *)captureSessionPresetForVideoResolution:(EXCameraVideoResolution)resolution;
+ (AVCaptureVideoOrientation)videoOrientationForDeviceOrientation:(UIDeviceOrientation)orientation;
+ (AVCaptureVideoOrientation)videoOrientationForInterfaceOrientation:(UIInterfaceOrientation)orientation;
+ (int)exportImageOrientation:(UIImageOrientation)orientation;
+ (AVVideoCodecType)videoCodecForType:(EXCameraVideoCodec)videoCodecType;

// Image utilities
+ (nonnull UIImage *)generatePhotoOfSize:(CGSize)size;
+ (UIImage *)cropImage:(UIImage *)image toRect:(CGRect)rect;
+ (nonnull NSString *)writeImage:(NSData *)image toPath:(NSString *)path;
+ (NSMutableDictionary *)updateExifMetadata:(NSDictionary *)metadata withAdditionalData:(NSDictionary *)additionalData;
+ (NSData *)dataFromImage:(UIImage *)image withMetadata:(NSDictionary *)exif imageQuality:(float)quality;

@end
