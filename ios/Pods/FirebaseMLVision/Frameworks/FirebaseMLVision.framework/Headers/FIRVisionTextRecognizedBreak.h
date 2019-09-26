#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionTextRecognizedBreakType
 * An enum of recognized text break types.
 */
typedef NS_ENUM(NSInteger, FIRVisionTextRecognizedBreakType) {
  /** Unknown break type. */
  FIRVisionTextRecognizedBreakTypeUnknown,
  /** Line-wrapping break type. */
  FIRVisionTextRecognizedBreakTypeLineWrap,
  /** Hyphen break type. */
  FIRVisionTextRecognizedBreakTypeHyphen,
  /** Line break that ends a paragraph. */
  FIRVisionTextRecognizedBreakTypeLineBreak,
  /** Space break type. */
  FIRVisionTextRecognizedBreakTypeSpace,
  /** Sure space break type. */
  FIRVisionTextRecognizedBreakTypeSureSpace,
} NS_SWIFT_NAME(VisionTextRecognizedBreakType);

/** Detected break from text recognition. */
NS_SWIFT_NAME(VisionTextRecognizedBreak)
@interface FIRVisionTextRecognizedBreak : NSObject

/** The recognized text break type. */
@property(nonatomic, readonly) FIRVisionTextRecognizedBreakType type;

/**
 * Indicates whether the break prepends the text element. If `NO`, the break comes after the text
 * element.
 */
@property(nonatomic, readonly) BOOL isPrefix;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
