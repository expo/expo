//
//  ABI48_0_0RNSharedElementDelegate.h
//  ABI48_0_0React-native-shared-element
//

#ifndef ABI48_0_0RNSharedElementDelegate_h
#define ABI48_0_0RNSharedElementDelegate_h

#import "ABI48_0_0RNSharedElementStyle.h"
#import "ABI48_0_0RNSharedElementContent.h"
#import "ABI48_0_0RNSharedElementTypes.h"

@protocol ABI48_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI48_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI48_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
