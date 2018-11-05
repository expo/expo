#import <AVFoundation/AVFoundation.h>
#import <GoogleMobileVision/GoogleMobileVision.h>

#import "GMVOutputTrackerDelegate.h"

@class GMVDataOutput;

/**
 * The GMVDataOutput's delegate. It is informed about detection states and results.
 */
@protocol GMVDataOutputDelegate<NSObject>

@optional

/**
 * Notification that a camera frame has been received and that the detector will start the
 * detection process.
 * @param dataOutput The GMVDataOutput object requesting the call.
 */
- (void)dataOutputWillStartDetection:(GMVDataOutput *)dataOutput;

/**
 * Notification that a detection has finished.
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @param results The full detection results.
 */
- (void)dataOutput:(GMVDataOutput *)dataOutput
    didFinishedDetection:(NSArray<__kindof GMVFeature *> *)results;

@end


/**
 * GMVDataOutput is a subclass of AVCaptureVideoDataoutput. It is the abstract base class for
 * GMV-based data outputs which filters the set of detection results. Once a feature has been
 * detected and a delegate has been informed, that same feature is consistently delivered to that
 * delegate until it disappears from the frame. Subclasses should overwrite the
 * receivedRestuls: and cleanup: methods.
 */
@interface GMVDataOutput : AVCaptureVideoDataOutput

/**
 * Data source information delegate.
 */
@property(nonatomic, weak) id<GMVDataOutputDelegate> dataDelegate;

/**
 * Sets the camera device position to help calculate image rotation. If not provided, it will
 * try to retreive position info through AVCaptureConnection.
 */
@property(nonatomic, assign) AVCaptureDevicePosition captureDevicePosition;

/**
 * Sets the preview frame size to help calculate correct xScale, yScale, and offset values. If
 * non provided, it will use the screen size.
 */
@property(nonatomic, assign) CGSize previewFrameSize;

/**
 * The maximum allowable frames must pass without detecting a specific feature before delegate
 * is notified the feature is no longer available. The value is default to 3.
 */
@property(nonatomic, assign) NSUInteger maxFrameGap;

/**
 * The video frames captured by the camera have different size than video preview.
 * The value is used to calculate the horizontal scale factor to properly display the
 * features. The calculation assumes AVLayerVideoGravityResizeAspect is the video gravity setting.
 * This property only returns a valid value after the first camera frame has been processed.
 */
@property(nonatomic, readonly, assign) CGFloat xScale;
/**
 * The video frames captured by the camera have different size than video preview.
 * The value is used to calculate the vertical scale factor to properly display the
 * features. The calculation assumes AVLayerVideoGravityResizeAspect is the video gravity setting.
 * This property only returns a valid value after the first camera frame has been processed.
 */
@property(nonatomic, readonly, assign) CGFloat yScale;
/**
 * The video frames captured by the camera have different size than video preview.
 * The value is used to calculate the offset to properly display the features. The calculation
 * assumes AVLayerVideoGravityResizeAspect is the video gravity setting. This property only returns
 * a valid value after the first camera frame has been processed.
 */
@property(nonatomic, readonly, assign) CGPoint offset;

/**
 * Designated initializer.
 * @param detector use to run detection.
 */
- (instancetype)initWithDetector:(GMVDetector *)detector NS_DESIGNATED_INITIALIZER;

// Subclasses need to override these methods.

/**
 * Detected GMVFeature results.
 * @param results The full detection results.
 */
- (void)receivedResults:(NSArray<__kindof GMVFeature *> *)results;
/**
 * Clean up resources.
 */
- (void)cleanup;

@end
