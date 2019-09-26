#import <Foundation/Foundation.h>

@class FIRVisionTextBlock;

NS_ASSUME_NONNULL_BEGIN

/** Recognized text in an image. */
NS_SWIFT_NAME(VisionText)
@interface FIRVisionText : NSObject

/** String representation of the recognized text. */
@property(nonatomic, readonly) NSString *text;

/** An array of blocks recognized in the text. */
@property(nonatomic, readonly) NSArray<FIRVisionTextBlock *> *blocks;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
