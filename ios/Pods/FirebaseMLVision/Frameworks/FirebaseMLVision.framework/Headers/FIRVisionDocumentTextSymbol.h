#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionTextRecognizedBreak;
@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/** A document text symbol recognized in an image. */
NS_SWIFT_NAME(VisionDocumentTextSymbol)
@interface FIRVisionDocumentTextSymbol : NSObject

/** String representation of the document text symbol that was recognized. */
@property(nonatomic, readonly) NSString *text;

/**
 * The rectangle that contains the document text symbol relative to the image in the default
 * coordinate space.
 */
@property(nonatomic, readonly) CGRect frame;

/** The confidence of the recognized document text symbol. */
@property(nonatomic, readonly) NSNumber *confidence;

/**
 * An array of recognized languages in the document text symbol. If no languages are recognized, the
 * array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/** The recognized start or end of the document text symbol. */
@property(nonatomic, readonly, nullable) FIRVisionTextRecognizedBreak *recognizedBreak;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
