/**
 @file          BNCLocalization.h
 @package       Branch-SDK
 @brief         Branch string localizations.

 @author        Parth Kalavadia
 @date          July 2017
 @copyright     Copyright © 2017 Branch. All rights reserved.
*/

/**
    @discusion

    # BNCLocalization

    Since the Branch SDK can be shipped as a static library, it can't use the standard Apple
    string localization mechanism.

    Use this class to localize the few user-facing string resources the Branch SDK has.
*/

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface BNCLocalization : NSObject

+ (instancetype) shared;
+ (NSString*) applicationLanguage;
+ (NSDictionary<NSString*, NSDictionary*>*) languageDictionaries;
- (NSString*) localizeString:(NSString*)string;

/// Set to an empty string or nil to reset the current language.
@property (copy, atomic) NSString* currentLanguage;
@property (strong, atomic, readonly) NSDictionary *currentLanguageDictionary;
@end

#pragma mark Convenience Functions

static inline NSString* BNCLocalizedString(NSString*const string) {
    return [[BNCLocalization shared] localizeString:string];
}

extern NSString* BNCLocalizedFormattedString(NSString*const format, ...) NS_FORMAT_FUNCTION(1,2);

NS_ASSUME_NONNULL_END
