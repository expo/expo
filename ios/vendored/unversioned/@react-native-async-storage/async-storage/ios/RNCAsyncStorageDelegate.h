/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RNCAsyncStorageCompletion)(NSError *_Nullable error);
typedef void (^RNCAsyncStorageResultCallback)(NSArray<id<NSObject>> *valuesOrErrors);

@protocol RNCAsyncStorageDelegate <NSObject>

/*!
 * Returns all keys currently stored. If none, an empty array is returned.
 * @param block Block to call with result.
 */
- (void)allKeys:(RNCAsyncStorageResultCallback)block;

/*!
 * Merges values with the corresponding values stored at specified keys.
 * @param values Values to merge.
 * @param keys Keys to the values that should be merged with.
 * @param block Block to call with merged result.
 */
- (void)mergeValues:(NSArray<NSString *> *)values
            forKeys:(NSArray<NSString *> *)keys
         completion:(RNCAsyncStorageResultCallback)block;

/*!
 * Removes all values from the store.
 * @param block Block to call with result.
 */
- (void)removeAllValues:(RNCAsyncStorageCompletion)block;

/*!
 * Removes all values associated with specified keys.
 * @param keys Keys of values to remove.
 * @param block Block to call with result.
 */
- (void)removeValuesForKeys:(NSArray<NSString *> *)keys
                 completion:(RNCAsyncStorageResultCallback)block;

/*!
 * Sets specified key-value pairs.
 * @param values Values to set.
 * @param keys Keys of specified values to set.
 * @param block Block to call with result.
 */
- (void)setValues:(NSArray<NSString *> *)values
          forKeys:(NSArray<NSString *> *)keys
       completion:(RNCAsyncStorageResultCallback)block;

/*!
 * Returns values associated with specified keys.
 * @param keys Keys of values to return.
 * @param block Block to call with result.
 */
- (void)valuesForKeys:(NSArray<NSString *> *)keys completion:(RNCAsyncStorageResultCallback)block;

@optional

/*!
 * Returns whether the delegate should be treated as a passthrough.
 */
@property (nonatomic, readonly, getter=isPassthrough) BOOL passthrough;

@end

NS_ASSUME_NONNULL_END
