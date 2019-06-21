#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "GMVDetectorConstants.h"

@interface GMVUtility : NSObject

/**
 * Converts CMSampleBuffer to UIImage. This function supports 420v, 420f, and BGRA
 * CVPixelBufferPixelFormatTypes.
 *
 * @param sampleBuffer The buffer to convert to UIImage.
 * @returns UIImage in RGBA8888 format.
 */
+ (UIImage *)sampleBufferTo32RGBA:(CMSampleBufferRef)sampleBuffer;

/**
 * Converts CMSampleBuffer to RGBA8888 data format. This function supports 420v, 420f, and BGRA
 * CVPixelBufferPixelFormatTypes. The output data corresponds to an image with exact same width
 * and height than input |sampleBuffer|. The number of bytes in a pixel row corresponds to the
 * returned NSData's length divided by height.
 *
 * @param sampleBuffer The buffer to convert to NSData.
 * @returns NSData in RGBA8888 format.
 */
+ (NSData *)anySampleBufferFormatTo32RGBA:(CMSampleBufferRef)sampleBuffer;

/**
 * This function determines the image exif metadata using device orientation and device
 * position. The orientation is significant when using detections on an image generated
 * from AVCaptureVideoDataOutput CMSampleBuffer. AVCaptureVideoDataOutput does not support
 * setting the video orientation, therefore the client has to handle the rotation on their own.
 * GMVImageOrientation can be passed in to GMVDetector featuresInImage:options: to let the
 * detector handle the video rotation for you.
 *
 * @param deviceOrientation The device orientation.
 * @param position The caputre device position.
 * @param defaultOrientation The default device orientation to use when |deviceOrientaiton| has
 *        value as UIDeviceOrientationFaceUp or UIDeviceOrientationFaceDown.
 * @returns GMVImageOrientation value to express an image exif metadata.
 */
+ (GMVImageOrientation)imageOrientationFromOrientation:(UIDeviceOrientation)deviceOrientation
                             withCaptureDevicePosition:(AVCaptureDevicePosition)position
                              defaultDeviceOrientation:(UIDeviceOrientation)defaultOrientation;

/**
 * Converts a RGBA buffer to an UIImage. The number of bytes in a pixel row is inferred from
 * |data|'s length divided by |height|.
 *
 * @param data The RGBA buffer.
 * @param width The width of the buffer.
 * @param height The height of the height of the buffer.
 * @returns An UIImage instance constructed from |data|.
 */
+ (UIImage *)imageFromData:(NSData *)data width:(size_t)width height:(size_t)height;

@end
