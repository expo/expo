//
//  ABI41_0_0RNSharedElementDelegate.h
//  ABI41_0_0React-native-shared-element
//

#ifndef ABI41_0_0RNSharedElementDelegate_h
#define ABI41_0_0RNSharedElementDelegate_h

#import "ABI41_0_0RNSharedElementStyle.h"
#import "ABI41_0_0RNSharedElementContent.h"
#import "ABI41_0_0RNSharedElementTypes.h"

@protocol ABI41_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI41_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI41_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
