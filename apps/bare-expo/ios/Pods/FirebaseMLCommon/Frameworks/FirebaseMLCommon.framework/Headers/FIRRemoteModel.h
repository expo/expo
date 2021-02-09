#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** A model that is stored remotely on the server and downloaded to the device. */
NS_SWIFT_NAME(RemoteModel)
@interface FIRRemoteModel : NSObject

/** The model name. */
@property(nonatomic, copy, readonly) NSString *name;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
