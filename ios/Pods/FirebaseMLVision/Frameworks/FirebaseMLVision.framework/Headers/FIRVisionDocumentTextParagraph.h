#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionDocumentTextWord;
@class FIRVisionTextRecognizedBreak;
@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A document text paragraph recognized in an image that consists of an array of words.
 */
NS_SWIFT_NAME(VisionDocumentTextParagraph)
@interface FIRVisionDocumentTextParagraph : NSObject

/**
 * String representation of the document text paragraph that was recognized.
 */
@property(nonatomic, readonly) NSString *text;

/**
 * An array of words in the document text paragraph.
 */
@property(nonatomic, readonly) NSArray<FIRVisionDocumentTextWord *> *words;

/**
 * The rectangle that contains the document text paragraph relative to the image in the default
 * coordinate space.
 */
@property(nonatomic, readonly) CGRect frame;

/**
 * The confidence of the recognized document text paragraph.
 */
@property(nonatomic, readonly) NSNumber *confidence;

/**
 * An array of recognized languages in the document text paragraph. If no languages are recognized,
 * the array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/**
 * The recognized start or end of the document text paragraph.
 */
@property(nonatomic, readonly, nullable) FIRVisionTextRecognizedBreak *recognizedBreak;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
