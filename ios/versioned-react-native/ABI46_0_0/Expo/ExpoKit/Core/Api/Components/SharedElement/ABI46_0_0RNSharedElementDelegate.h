//
//  ABI46_0_0RNSharedElementDelegate.h
//  ABI46_0_0React-native-shared-element
//

#ifndef ABI46_0_0RNSharedElementDelegate_h
#define ABI46_0_0RNSharedElementDelegate_h

#import "ABI46_0_0RNSharedElementStyle.h"
#import "ABI46_0_0RNSharedElementContent.h"
#import "ABI46_0_0RNSharedElementTypes.h"

@protocol ABI46_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI46_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI46_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
