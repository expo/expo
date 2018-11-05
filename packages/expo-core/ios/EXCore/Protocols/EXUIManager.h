// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXUIManager <NSObject>

- (void)addUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass;
- (void)addUIBlock:(void (^)(id))block forView:(id)viewId implementingProtocol:(Protocol *)protocol;
- (void)dispatchOnClientThread:(dispatch_block_t)block;

@end
