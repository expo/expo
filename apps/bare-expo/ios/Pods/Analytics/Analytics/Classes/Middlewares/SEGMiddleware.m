//
//  SEGMiddleware.m
//  Analytics
//
//  Created by Tony Xiao on 9/19/16.
//  Copyright © 2016 Segment. All rights reserved.
//

#import "SEGUtils.h"
#import "SEGMiddleware.h"


@implementation SEGBlockMiddleware

- (instancetype)initWithBlock:(SEGMiddlewareBlock)block
{
    if (self = [super init]) {
        _block = block;
    }
    return self;
}

- (void)context:(SEGContext *)context next:(SEGMiddlewareNext)next
{
    self.block(context, next);
}

@end


@implementation SEGMiddlewareRunner

- (instancetype)initWithMiddlewares:(NSArray<id<SEGMiddleware>> *_Nonnull)middlewares
{
    if (self = [super init]) {
        _middlewares = middlewares;
    }
    return self;
}

- (void)run:(SEGContext *_Nonnull)context callback:(RunMiddlewaresCallback _Nullable)callback
{
    [self runMiddlewares:self.middlewares context:context callback:callback];
}

// TODO: Maybe rename SEGContext to SEGEvent to be a bit more clear?
// We could also use some sanity check / other types of logging here.
- (void)runMiddlewares:(NSArray<id<SEGMiddleware>> *_Nonnull)middlewares
               context:(SEGContext *_Nonnull)context
              callback:(RunMiddlewaresCallback _Nullable)callback
{
    BOOL earlyExit = context == nil;
    if (middlewares.count == 0 || earlyExit) {
        if (callback) {
            callback(earlyExit, middlewares);
        }
        return;
    }

    [middlewares[0] context:context next:^(SEGContext *_Nullable newContext) {
        NSArray *remainingMiddlewares = [middlewares subarrayWithRange:NSMakeRange(1, middlewares.count - 1)];
        [self runMiddlewares:remainingMiddlewares context:newContext callback:callback];
    }];
}

@end
