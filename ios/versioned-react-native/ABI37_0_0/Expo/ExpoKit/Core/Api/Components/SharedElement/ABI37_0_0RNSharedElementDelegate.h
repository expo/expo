//
//  ABI37_0_0RNSharedElementDelegate.h
//  ABI37_0_0React-native-shared-element
//

#ifndef ABI37_0_0RNSharedElementDelegate_h
#define ABI37_0_0RNSharedElementDelegate_h

#import "ABI37_0_0RNSharedElementStyle.h"
#import "ABI37_0_0RNSharedElementContent.h"
#import "ABI37_0_0RNSharedElementTypes.h"

@protocol ABI37_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI37_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI37_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
