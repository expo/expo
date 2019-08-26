#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Detected language from text recognition. */
NS_SWIFT_NAME(VisionTextRecognizedLanguage)
@interface FIRVisionTextRecognizedLanguage : NSObject

/**
 *  The BCP-47 language code, such as, "en-US" or "sr-Latn". For more information, see
 *  http://www.unicode.org/reports/tr35/#Unicode_locale_identifier.
 */
@property(nonatomic, readonly, nullable) NSString *languageCode;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
