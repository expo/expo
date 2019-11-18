//
//  ABI36_0_0RNSharedElementDelegate.h
//  ABI36_0_0React-native-shared-element
//

#ifndef ABI36_0_0RNSharedElementDelegate_h
#define ABI36_0_0RNSharedElementDelegate_h

#import "ABI36_0_0RNSharedElementStyle.h"
#import "ABI36_0_0RNSharedElementTypes.h"

@protocol ABI36_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI36_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(id)content contentType:(ABI36_0_0RNSharedElementContentType)contentType node:(id)node;
@end

#endif
