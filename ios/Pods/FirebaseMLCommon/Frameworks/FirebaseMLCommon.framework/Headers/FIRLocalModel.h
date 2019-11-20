#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** A model stored locally on the device. */
NS_SWIFT_NAME(LocalModel)
@interface FIRLocalModel : NSObject

/** The model name. */
@property(nonatomic, copy, readonly) NSString *name;

/** An absolute path to the model file stored locally on the device. */
@property(nonatomic, copy, readonly) NSString *path;

/**
 * Creates an instance of `LocalModel` with the given name and file path.
 *
 * @param name The name of the local model. Within the same Firebase app, all local models should
 *     have distinct names.
 * @param path An absolute path to the model file stored locally on the device. For a custom model,
 *     this should be the path to the TensorFlow Lite model. For an AutoML Vision Edge model, this
 *     should be the path to the model manifest file.
 * @return A new `LocalModel` instance.
 */
- (instancetype)initWithName:(NSString *)name
                        path:(NSString *)path NS_DESIGNATED_INITIALIZER
    NS_SWIFT_NAME(init(name:path:));

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
