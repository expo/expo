//
//  LOTCacheProvider.h
//  Lottie
//
//  Created by punmy on 2017/7/8.
//
//

#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR

#import <UIKit/UIKit.h>
@compatibility_alias LOTImage UIImage;

@protocol LOTImageCache;

#pragma mark - LOTCacheProvider

@interface LOTCacheProvider : NSObject

+ (id<LOTImageCache>)imageCache;
+ (void)setImageCache:(id<LOTImageCache>)cache;

@end

#pragma mark - LOTImageCache

/**
 This protocol represent the interface of a image cache which lottie can use.
 */
@protocol LOTImageCache <NSObject>

@required
- (LOTImage *)imageForKey:(NSString *)key;
- (void)setImage:(LOTImage *)image forKey:(NSString *)key;

@end

#endif
