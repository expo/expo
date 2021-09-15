//
//  ABI42_0_0RNSharedElementDelegate.h
//  ABI42_0_0React-native-shared-element
//

#ifndef ABI42_0_0RNSharedElementDelegate_h
#define ABI42_0_0RNSharedElementDelegate_h

#import "ABI42_0_0RNSharedElementStyle.h"
#import "ABI42_0_0RNSharedElementContent.h"
#import "ABI42_0_0RNSharedElementTypes.h"

@protocol ABI42_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI42_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI42_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
