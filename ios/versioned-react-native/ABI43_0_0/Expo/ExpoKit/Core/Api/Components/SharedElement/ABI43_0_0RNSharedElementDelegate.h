//
//  ABI43_0_0RNSharedElementDelegate.h
//  ABI43_0_0React-native-shared-element
//

#ifndef ABI43_0_0RNSharedElementDelegate_h
#define ABI43_0_0RNSharedElementDelegate_h

#import "ABI43_0_0RNSharedElementStyle.h"
#import "ABI43_0_0RNSharedElementContent.h"
#import "ABI43_0_0RNSharedElementTypes.h"

@protocol ABI43_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI43_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI43_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
