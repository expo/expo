

//--------------------------------------------------------------------------------------------------
//
//                                                                                 NSString+Branch.h
//                                                                                  Branch.framework
//
//                                                                                NSString Additions
//                                                                       Edward Smith, February 2017
//
//                                             -©- Copyright © 2017 Branch, all rights reserved. -©-
//
//--------------------------------------------------------------------------------------------------

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface NSString (Branch)

///@discussion Compares the receiver to a masked string.  Masked characters (the '*' character) are
/// ignored for purposes of the compare.
///
///@return YES if string (ignoring any masked characters) is equal to the receiver.
- (BOOL) bnc_isEqualToMaskedString:(NSString*_Nullable)string;

///@return Returns a string that is truncated at the first null character.
- (NSString*_Nonnull) bnc_stringTruncatedAtNull;

///@discusion The `containsString:` method isn't supported pre-iOS 8.  Here we roll our own.
//
///@param string    The string to for comparison.
///@return          Reurns true if the instance contains the string.
- (BOOL) bnc_containsString:(NSString*_Nullable)string;
@end

void BNCForceNSStringCategoryToLoad(void) __attribute__((constructor));
