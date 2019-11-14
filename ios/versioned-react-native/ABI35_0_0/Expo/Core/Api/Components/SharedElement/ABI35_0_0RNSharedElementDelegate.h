//
//  ABI35_0_0RNSharedElementDelegate.h
//  ReactABI35_0_0-native-shared-element
//

#ifndef ABI35_0_0RNSharedElementDelegate_h
#define ABI35_0_0RNSharedElementDelegate_h

#import "ABI35_0_0RNSharedElementStyle.h"
#import "ABI35_0_0RNSharedElementTypes.h"

@protocol ABI35_0_0RNSharedElementDelegate
- (void) didLoadStyle:(ABI35_0_0RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(id)content contentType:(ABI35_0_0RNSharedElementContentType)contentType node:(id)node;
@end

#endif
