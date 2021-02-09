//
//  ABI39_0_0RNSharedElementDelegate.h
//  ABI39_0_0React-native-shared-element
//

#ifndef ABI39_0_0RNSharedElementDelegate_h
#define ABI39_0_0RNSharedElementDelegate_h

#import "ABI39_0_0RNSharedElementStyle.h"
#import "ABI39_0_0RNSharedElementContent.h"
#import "ABI39_0_0RNSharedElementTypes.h"

@protocol ABI39_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI39_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI39_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
