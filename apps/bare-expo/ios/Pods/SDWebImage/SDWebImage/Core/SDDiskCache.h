/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

@class SDImageCacheConfig;
/**
 A protocol to allow custom disk cache used in SDImageCache.
 */
@protocol SDDiskCache <NSObject>

// All of these method are called from the same global queue to avoid blocking on main queue and thread-safe problem. But it's also recommend to ensure thread-safe yourself using lock or other ways.
@required
/**
 Create a new disk cache based on the specified path. You can check `maxDiskSize` and `maxDiskAge` used for disk cache.
 
 @param cachePath Full path of a directory in which the cache will write data.
 Once initialized you should not read and write to this directory.
 @param config The cache config to be used to create the cache.
 
 @return A new cache object, or nil if an error occurs.
 */
- (nullable instancetype)initWithCachePath:(nonnull NSString *)cachePath config:(nonnull SDImageCacheConfig *)config;

/**
 Returns a boolean value that indicates whether a given key is in cache.
 This method may blocks the calling thread until file read finished.
 
 @param key A string identifying the data. If nil, just return NO.
 @return Whether the key is in cache.
 */
- (BOOL)containsDataForKey:(nonnull NSString *)key;

/**
 Returns the data associated with a given key.
 This method may blocks the calling thread until file read finished.
 
 @param key A string identifying the data. If nil, just return nil.
 @return The value associated with key, or nil if no value is associated with key.
 */
- (nullable NSData *)dataForKey:(nonnull NSString *)key;

/**
 Sets the value of the specified key in the cache.
 This method may blocks the calling thread until file write finished.
 
 @param data The data to be stored in the cache.
 @param key    The key with which to associate the value. If nil, this method has no effect.
 */
- (void)setData:(nullable NSData *)data forKey:(nonnull NSString *)key;

/**
 Returns the extended data associated with a given key.
 This method may blocks the calling thread until file read finished.
 
 @param key A string identifying the data. If nil, just return nil.
 @return The value associated with key, or nil if no value is associated with key.
 */
- (nullable NSData *)extendedDataForKey:(nonnull NSString *)key;

/**
 Set extended data with a given key.
 
 @discussion You can set any extended data to exist cache key. Without override the exist disk file data.
 on UNIX, the common way for this is to use the Extended file attributes (xattr)
 
 @param extendedData The extended data (pass nil to remove).
 @param key The key with which to associate the value. If nil, this method has no effect.
*/
- (void)setExtendedData:(nullable NSData *)extendedData forKey:(nonnull NSString *)key;

/**
 Removes the value of the specified key in the cache.
 This method may blocks the calling thread until file delete finished.
 
 @param key The key identifying the value to be removed. If nil, this method has no effect.
 */
- (void)removeDataForKey:(nonnull NSString *)key;

/**
 Empties the cache.
 This method may blocks the calling thread until file delete finished.
 */
- (void)removeAllData;

/**
 Removes the expired data from the cache. You can choose the data to remove base on `ageLimit`, `countLimit` and `sizeLimit` options.
 */
- (void)removeExpiredData;

/**
 The cache path for key

 @param key A string identifying the value
 @return The cache path for key. Or nil if the key can not associate to a path
 */
- (nullable NSString *)cachePathForKey:(nonnull NSString *)key;

/**
 Returns the number of data in this cache.
 This method may blocks the calling thread until file read finished.
 
 @return The total data count.
 */
- (NSUInteger)totalCount;

/**
 Returns the total size (in bytes) of data in this cache.
 This method may blocks the calling thread until file read finished.
 
 @return The total data size in bytes.
 */
- (NSUInteger)totalSize;

@end

/**
 The built-in disk cache.
 */
@interface SDDiskCache : NSObject <SDDiskCache>
/**
 Cache Config object - storing all kind of settings.
 */
@property (nonatomic, strong, readonly, nonnull) SDImageCacheConfig *config;

- (nonnull instancetype)init NS_UNAVAILABLE;

/**
 Move the cache directory from old location to new location, the old location will be removed after finish.
 If the old location does not exist, does nothing.
 If the new location does not exist, only do a movement of directory.
 If the new location does exist, will move and merge the files from old location.
 If the new location does exist, but is not a directory, will remove it and do a movement of directory.

 @param srcPath old location of cache directory
 @param dstPath new location of cache directory
 */
- (void)moveCacheDirectoryFromPath:(nonnull NSString *)srcPath toPath:(nonnull NSString *)dstPath;

@end
