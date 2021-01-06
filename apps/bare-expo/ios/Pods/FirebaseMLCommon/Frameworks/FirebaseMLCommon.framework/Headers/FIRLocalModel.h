#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** A model stored locally on the device. */
NS_SWIFT_NAME(LocalModel)
@interface FIRLocalModel : NSObject

/** An absolute path to a model file stored locally on the device. */
@property(nonatomic, copy, readonly) NSString *path;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
