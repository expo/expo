#import <GoogleMobileVision/GoogleMobileVision.h>

@class GMVDataOutput;

/**
 * Delegate used to receive notifications for a detected item over time.
 */
@protocol GMVOutputTrackerDelegate<NSObject>

/**
 * Called to initially inform the delegate that a new item has been detected. The tracking ID will
 * remain constant for all calls to dataOutput:updateFocusingFeature:forResultSet: until
 * dataOutputCompletedWithFocusingFeature: is called.
 * dataOutput:updateFeatures:focusingFeature: is always called immediately following this
 * method call, with the same item that was passed into this method.
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @param features The full detection results.
 */
- (void)dataOutput:(GMVDataOutput *)dataOutput
   detectedFeature:(GMVFeature *)feature;

/**
 * As a feature is detected over time, this method is called to give an update for the feature in
 * the context of the overall detection. Each feature that is received has the same tracking ID as
 * it had in the most recent call to dataOutput:detectedFeature:. That is, it has been determined
 * to be the same tracked feature initially seen.
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @param feature The GMVFeature associated with the delegate.
 * @param features The full detection results.
 */
- (void)dataOutput:(GMVDataOutput *)dataOutput
  updateFocusingFeature:(GMVFeature *)feature
           forResultSet:(NSArray<__kindof GMVFeature *> *)features;

/**
 * Called if either the tracked feature was not detected at all in a frame, or if the specific
 * feature identity associated with the delegate is not present in the current frame. It's possible
 * that the feature may be missed for a few frames, and will reappear later, depending upon the
 * detector settings. dataOutput:updateFocusingFeature:forResultSet: would then be called.
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @param features The full detection results.
 */
- (void)dataOutput:(GMVDataOutput *)dataOutput
  updateMissingFeatures:(NSArray<__kindof GMVFeature *> *)features;

/**
 * Called to indicate the feature associated with the tracking ID previously reported via
 * dataOutput:detectedFeature: has been assumed to be gone forever.
 * @param dataOutput The GMVDataOutput object requesting the call.
 */
- (void)dataOutputCompletedWithFocusingFeature:(GMVDataOutput *)dataOutput;

@end
