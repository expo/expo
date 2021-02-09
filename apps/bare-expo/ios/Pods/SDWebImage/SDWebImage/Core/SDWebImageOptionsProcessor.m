/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageOptionsProcessor.h"

@interface SDWebImageOptionsResult ()

@property (nonatomic, assign) SDWebImageOptions options;
@property (nonatomic, copy, nullable) SDWebImageContext *context;

@end

@implementation SDWebImageOptionsResult

- (instancetype)initWithOptions:(SDWebImageOptions)options context:(SDWebImageContext *)context {
    self = [super init];
    if (self) {
        self.options = options;
        self.context = context;
    }
    return self;
}

@end

@interface SDWebImageOptionsProcessor ()

@property (nonatomic, copy, nonnull) SDWebImageOptionsProcessorBlock block;

@end

@implementation SDWebImageOptionsProcessor

- (instancetype)initWithBlock:(SDWebImageOptionsProcessorBlock)block {
    self = [super init];
    if (self) {
        self.block = block;
    }
    return self;
}

+ (instancetype)optionsProcessorWithBlock:(SDWebImageOptionsProcessorBlock)block {
    SDWebImageOptionsProcessor *optionsProcessor = [[SDWebImageOptionsProcessor alloc] initWithBlock:block];
    return optionsProcessor;
}

- (SDWebImageOptionsResult *)processedResultForURL:(NSURL *)url options:(SDWebImageOptions)options context:(SDWebImageContext *)context {
    if (!self.block) {
        return nil;
    }
    return self.block(url, options, context);
}

@end
