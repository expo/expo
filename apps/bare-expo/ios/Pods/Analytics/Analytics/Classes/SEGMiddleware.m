//
//  SEGMiddleware.m
//  Analytics
//
//  Created by Tony Xiao on 9/19/16.
//  Copyright © 2016 Segment. All rights reserved.
//

#import "SEGUtils.h"
#import "SEGMiddleware.h"


@implementation SEGDestinationMiddleware
- (instancetype)initWithKey:(NSString *)integrationKey middleware:(NSArray<id<SEGMiddleware>> *)middleware
{
    if (self = [super init]) {
        _integrationKey = integrationKey;
        _middleware = middleware;
    }
    return self;
}
@end

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

- (instancetype)initWithMiddleware:(NSArray<id<SEGMiddleware>> *_Nonnull)middlewares
{
    if (self = [super init]) {
        _middlewares = middlewares;
    }
    return self;
}

- (SEGContext *)run:(SEGContext *_Nonnull)context callback:(RunMiddlewaresCallback _Nullable)callback
{
    return [self runMiddlewares:self.middlewares context:context callback:callback];
}

// TODO: Maybe rename SEGContext to SEGEvent to be a bit more clear?
// We could also use some sanity check / other types of logging here.
- (SEGContext *)runMiddlewares:(NSArray<id<SEGMiddleware>> *_Nonnull)middlewares
               context:(SEGContext *_Nonnull)context
              callback:(RunMiddlewaresCallback _Nullable)callback
{
    __block SEGContext * _Nonnull result = context;

    BOOL earlyExit = context == nil;
    if (middlewares.count == 0 || earlyExit) {
        if (callback) {
            callback(earlyExit, middlewares);
        }
        return context;
    }
    
    [middlewares[0] context:result next:^(SEGContext *_Nullable newContext) {
        NSArray *remainingMiddlewares = [middlewares subarrayWithRange:NSMakeRange(1, middlewares.count - 1)];
        result = [self runMiddlewares:remainingMiddlewares context:newContext callback:callback];
    }];
    
    return result;
}

@end
