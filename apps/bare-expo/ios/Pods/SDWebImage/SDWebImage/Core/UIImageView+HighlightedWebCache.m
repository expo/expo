/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "UIImageView+HighlightedWebCache.h"

#if SD_UIKIT

#import "UIView+WebCacheOperation.h"
#import "UIView+WebCache.h"
#import "SDInternalMacros.h"

static NSString * const SDHighlightedImageOperationKey = @"UIImageViewImageOperationHighlighted";

@implementation UIImageView (HighlightedWebCache)

- (void)sd_setHighlightedImageWithURL:(nullable NSURL *)url {
    [self sd_setHighlightedImageWithURL:url options:0 progress:nil completed:nil];
}

- (void)sd_setHighlightedImageWithURL:(nullable NSURL *)url options:(SDWebImageOptions)options {
    [self sd_setHighlightedImageWithURL:url options:options progress:nil completed:nil];
}

- (void)sd_setHighlightedImageWithURL:(nullable NSURL *)url options:(SDWebImageOptions)options context:(nullable SDWebImageContext *)context {
    [self sd_setHighlightedImageWithURL:url options:options context:context progress:nil completed:nil];
}

- (void)sd_setHighlightedImageWithURL:(nullable NSURL *)url completed:(nullable SDExternalCompletionBlock)completedBlock {
    [self sd_setHighlightedImageWithURL:url options:0 progress:nil completed:completedBlock];
}

- (void)sd_setHighlightedImageWithURL:(nullable NSURL *)url options:(SDWebImageOptions)options completed:(nullable SDExternalCompletionBlock)completedBlock {
    [self sd_setHighlightedImageWithURL:url options:options progress:nil completed:completedBlock];
}

- (void)sd_setHighlightedImageWithURL:(NSURL *)url options:(SDWebImageOptions)options progress:(nullable SDImageLoaderProgressBlock)progressBlock completed:(nullable SDExternalCompletionBlock)completedBlock {
    [self sd_setHighlightedImageWithURL:url options:options context:nil progress:progressBlock completed:completedBlock];
}

- (void)sd_setHighlightedImageWithURL:(nullable NSURL *)url
                              options:(SDWebImageOptions)options
                              context:(nullable SDWebImageContext *)context
                             progress:(nullable SDImageLoaderProgressBlock)progressBlock
                            completed:(nullable SDExternalCompletionBlock)completedBlock {
    @weakify(self);
    SDWebImageMutableContext *mutableContext;
    if (context) {
        mutableContext = [context mutableCopy];
    } else {
        mutableContext = [NSMutableDictionary dictionary];
    }
    mutableContext[SDWebImageContextSetImageOperationKey] = SDHighlightedImageOperationKey;
    [self sd_internalSetImageWithURL:url
                    placeholderImage:nil
                             options:options
                             context:mutableContext
                       setImageBlock:^(UIImage * _Nullable image, NSData * _Nullable imageData, SDImageCacheType cacheType, NSURL * _Nullable imageURL) {
                           @strongify(self);
                           self.highlightedImage = image;
                       }
                            progress:progressBlock
                           completed:^(UIImage * _Nullable image, NSData * _Nullable data, NSError * _Nullable error, SDImageCacheType cacheType, BOOL finished, NSURL * _Nullable imageURL) {
                               if (completedBlock) {
                                   completedBlock(image, error, cacheType, imageURL);
                               }
                           }];
}

@end

#endif
