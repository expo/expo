#import "GMVDataOutput.h"

/**
 * The GMVFocusingDataOutput's delegate. It asks the delegate to select a feature to focus on.
 */
@protocol GMVFocusingDataOutputDelegate<GMVDataOutputDelegate>

/**
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @returns The tracking ID of the detection item on which to focus. The ID is obtained from the
 * |results|.
 */
- (NSUInteger)dataOutput:(GMVDataOutput *)dataOutput
    shouldFocusOnFeatureFromResults:(NSArray<__kindof GMVFeature *> *)results;
@end

/**
 * A concrete subclass of GMVDataOutput. This dataOutput allows clients to select the item on
 * which GMVFeature to focus.
 */
@interface GMVFocusingDataOutput : GMVDataOutput

/**
 * Post processing delegation. The trackerDelegate is referenced strongly. Call |-cleanup| to
 * free up internal resources.
 */
@property(nonatomic, strong) id<GMVOutputTrackerDelegate> trackerDelegate;

/**
 * Data output delegate.
 */
@property(nonatomic, weak) id<GMVFocusingDataOutputDelegate> dataDelegate;

@end
