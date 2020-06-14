//
//  ABI38_0_0RNSharedElementDelegate.h
//  ABI38_0_0React-native-shared-element
//

#ifndef ABI38_0_0RNSharedElementDelegate_h
#define ABI38_0_0RNSharedElementDelegate_h

#import "ABI38_0_0RNSharedElementStyle.h"
#import "ABI38_0_0RNSharedElementContent.h"
#import "ABI38_0_0RNSharedElementTypes.h"

@protocol ABI38_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI38_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(ABI38_0_0RNSharedElementContent*)content node:(id)node;
@end

#endif
