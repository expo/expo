#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionDocumentTextSymbol;
@class FIRVisionTextRecognizedBreak;
@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A document text word recognized in an image that consists of an array of symbols.
 */
NS_SWIFT_NAME(VisionDocumentTextWord)
@interface FIRVisionDocumentTextWord : NSObject

/**
 * String representation of the document text word that was recognized.
 */
@property(nonatomic, readonly) NSString *text;

/**
 * An array of symbols in the document text word.
 */
@property(nonatomic, readonly) NSArray<FIRVisionDocumentTextSymbol *> *symbols;

/**
 * The rectangle that contains the document text word relative to the image in the default
 * coordinate space.
 */
@property(nonatomic, readonly) CGRect frame;

/**
 * The confidence of the recognized document text word.
 */
@property(nonatomic, readonly) NSNumber *confidence;

/**
 * An array of recognized languages in the document text word. If no languages are recognized, the
 * array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/**
 * The recognized start or end of the document text word.
 */
@property(nonatomic, readonly, nullable) FIRVisionTextRecognizedBreak *recognizedBreak;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
