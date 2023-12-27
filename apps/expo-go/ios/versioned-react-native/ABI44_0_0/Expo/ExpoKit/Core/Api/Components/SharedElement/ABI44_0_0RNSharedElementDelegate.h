//
//  ABI44_0_0RNSharedElementDelegate.h
//  ABI44_0_0React-native-shared-element
//

#ifndef ABI44_0_0RNSharedElementDelegate_h
#define ABI44_0_0RNSharedElementDelegate_h

#import "ABI44_0_0RNSharedElementStyle.h"
#import "ABI44_0_0RNSharedElementContent.h"
#import "ABI44_0_0RNSharedElementTypes.h"

@protocol ABI44_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI44_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI44_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
