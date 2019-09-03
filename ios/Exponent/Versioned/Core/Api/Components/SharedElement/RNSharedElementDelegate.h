//
//  RNSharedElementDelegate.h
//  react-native-shared-element
//

#ifndef RNSharedElementDelegate_h
#define RNSharedElementDelegate_h

#import "RNSharedElementStyle.h"
#import "RNSharedElementTypes.h"

@protocol RNSharedElementDelegate
- (void) didLoadStyle:(RNSharedElementStyle*)style node:(id)node;
- (void) didLoadContent:(id)content contentType:(RNSharedElementContentType)contentType node:(id)node;
@end

#endif
