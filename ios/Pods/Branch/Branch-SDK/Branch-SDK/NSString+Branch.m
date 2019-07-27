

//--------------------------------------------------------------------------------------------------
//
//                                                                                 NSString+Branch.m
//                                                                                  Branch.framework
//
//                                                                                NSString Additions
//                                                                       Edward Smith, February 2017
//
//                                             -©- Copyright © 2017 Branch, all rights reserved. -©-
//
//--------------------------------------------------------------------------------------------------


#import "NSString+Branch.h"


__attribute__((constructor)) void BNCForceNSStringCategoryToLoad() {
    //  Nothing here, but forces linker to load the category.
}


@implementation NSString (Branch)

- (BOOL) bnc_isEqualToMaskedString:(NSString*_Nullable)string {
    // Un-comment for debugging:
    // NSLog(@"bnc_isEqualToMaskedString self/string:\n%@\n%@.", self, string);
    if (!string) return NO;
    if (self.length != string.length) return NO;
    for (NSUInteger idx = 0; idx < self.length; idx++) {
        unichar p = [self characterAtIndex:idx];
        unichar q = [string characterAtIndex:idx];
        if (q != '*' && p != q) return NO;
    }
    return YES;
}

- (NSString*_Nonnull) bnc_stringTruncatedAtNull {
    NSRange range = [self rangeOfString:@"\0"];
    if (range.location == NSNotFound)
        return self;
    range.length = range.location;
    range.location = 0;
    return [self substringWithRange:range];
}

- (BOOL) bnc_containsString:(NSString*_Nullable)string {
    return (string && [self rangeOfString:(NSString*_Nonnull)string].location != NSNotFound);
}

@end
