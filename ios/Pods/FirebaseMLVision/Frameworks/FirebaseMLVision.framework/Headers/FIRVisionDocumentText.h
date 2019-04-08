#import <Foundation/Foundation.h>

@class FIRVisionDocumentTextBlock;

NS_ASSUME_NONNULL_BEGIN

/**
 * Recognized document text in an image.
 */
NS_SWIFT_NAME(VisionDocumentText)
@interface FIRVisionDocumentText : NSObject

/**
 * String representation of the recognized document text.
 */
@property(nonatomic, readonly) NSString *text;

/**
 * An array of blocks recognized in the document text.
 */
@property(nonatomic, readonly) NSArray<FIRVisionDocumentTextBlock *> *blocks;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
