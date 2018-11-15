#import "GMVFocusingDataOutput.h"

/**
 * A concrete subclass of GMVFocusingDataOutput. This dataOutput focuses on tracking a single
 * "prominent face", in conjunction with the associated face detector. A prominent face is defined
 * as a face which was initially the largest, most central face when tracking began. This face
 * will continue to be tracked as the prominent face for as long as it is visible, event when it
 * is not the largest face. When the current prominent face is no longer present, another face
 * will be selected as the new prominent face.
 * This class implements GMVFocusingDataOutputDelegate, so there's no need to assign dataDelegate.
 **/
@interface GMVLargestFaceFocusingDataOutput : GMVFocusingDataOutput

@end
