#import "GMVDataOutput.h"

/**
 * Delegate used to register GMVOutputTrackerDelegate for a specific feature.
 **/
@protocol GMVMultiDataOutputDelegate <NSObject>

/**
 * Returns an object that implements GMVOutputTrackerDelegate.
 * @param dataOutput The GMVDataOutput object requesting the call.
 * @param feature A detected feature.
 **/
- (id<GMVOutputTrackerDelegate>)dataOutput:(GMVDataOutput *)dataOutput
                         trackerForFeature:(GMVFeature *)feature;

@end

/**
 * A concrete sub-class of GMVDataOutput. This dataOutput distributes the items of a detection
 * result among an individual GMVOutputTrackerDelegate. This enables detection result processing
 * code to be defined at the individual item level, avoiding the need for boilerplate code for
 * iterating over and managing groups of items.
 **/
@interface GMVMultiDataOutput : GMVDataOutput

/**
 * The GMVOutputTrackerDelegate object returned by this delegate is retained strongly.
 * Call |-cleanup| to properly release internal variables.
 **/
@property(nonatomic, weak) id<GMVMultiDataOutputDelegate> multiDataDelegate;

@end
