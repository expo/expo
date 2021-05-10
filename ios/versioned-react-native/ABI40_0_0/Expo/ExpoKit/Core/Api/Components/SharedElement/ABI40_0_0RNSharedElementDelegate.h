//
//  ABI40_0_0RNSharedElementDelegate.h
//  ABI40_0_0React-native-shared-element
//

#ifndef ABI40_0_0RNSharedElementDelegate_h
#define ABI40_0_0RNSharedElementDelegate_h

#import "ABI40_0_0RNSharedElementStyle.h"
#import "ABI40_0_0RNSharedElementContent.h"
#import "ABI40_0_0RNSharedElementTypes.h"

@protocol ABI40_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI40_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI40_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
