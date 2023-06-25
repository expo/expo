//
//  ABI49_0_0RNSharedElementDelegate.h
//  ABI49_0_0React-native-shared-element
//

#ifndef ABI49_0_0RNSharedElementDelegate_h
#define ABI49_0_0RNSharedElementDelegate_h

#import "ABI49_0_0RNSharedElementStyle.h"
#import "ABI49_0_0RNSharedElementContent.h"
#import "ABI49_0_0RNSharedElementTypes.h"

@protocol ABI49_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI49_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI49_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
