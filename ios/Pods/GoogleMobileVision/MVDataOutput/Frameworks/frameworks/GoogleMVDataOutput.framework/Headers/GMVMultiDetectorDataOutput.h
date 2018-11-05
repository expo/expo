#import "GMVMultiDataOutput.h"

/**
 * Delegate used by GMVMultiDetectorDataOutput to receive detection results per detector.
 **/
@protocol GMVMultiDetectorDataOutputDelegate <NSObject>

/**
 * Returns an object that implements GMVOutputTrackerDelegate.
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @param detector The GMVDetector detecting the feature.
 * @param feature The detected feature.
 **/
- (id<GMVOutputTrackerDelegate>)dataOutput:(GMVDataOutput *)dataOutput
                              fromDetector:(GMVDetector *)detector
                         trackerForFeature:(GMVFeature *)feature;

@end

/**
 * A concrete subclass of GMVDataOutput. GMVMultiDetectorDataOutput allows clients to specify
 * multiple detectors in initialization. When receiving frames from the video pipeline, all
 * the detectoros will run detection separately on each frame.
 * The detection results are delivered through its multiDetectorDataDelegate.
 **/
@interface GMVMultiDetectorDataOutput : GMVDataOutput

/**
 * Methods of the protocol allow the delegate to perform post processing on detected features.
 * The GMVOutputTrackerDelegate object returned by this delegate is retained strongly.
 * Call |-cleanup| to properly release internal variables.
 **/
@property(nonatomic, weak) id<GMVMultiDetectorDataOutputDelegate> multiDetectorDataDelegate;

/**
 * Designated initializer.
 * @param detectors The detectors associated to the data output. |detectors| is expected to
 * be non-empty.
 */
- (instancetype)initWithDetectors:(NSArray<GMVDetector *> *)detectors NS_DESIGNATED_INITIALIZER;

@end
