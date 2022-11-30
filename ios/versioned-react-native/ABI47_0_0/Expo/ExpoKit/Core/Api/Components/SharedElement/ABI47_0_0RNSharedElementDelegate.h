//
//  ABI47_0_0RNSharedElementDelegate.h
//  ABI47_0_0React-native-shared-element
//

#ifndef ABI47_0_0RNSharedElementDelegate_h
#define ABI47_0_0RNSharedElementDelegate_h

#import "ABI47_0_0RNSharedElementStyle.h"
#import "ABI47_0_0RNSharedElementContent.h"
#import "ABI47_0_0RNSharedElementTypes.h"

@protocol ABI47_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI47_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI47_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
