//
//  ABI45_0_0RNSharedElementDelegate.h
//  ABI45_0_0React-native-shared-element
//

#ifndef ABI45_0_0RNSharedElementDelegate_h
#define ABI45_0_0RNSharedElementDelegate_h

#import "ABI45_0_0RNSharedElementStyle.h"
#import "ABI45_0_0RNSharedElementContent.h"
#import "ABI45_0_0RNSharedElementTypes.h"

@protocol ABI45_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI45_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI45_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
