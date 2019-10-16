// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol UMUIManager <NSObject>

- (void)addUIBlock:(void (^)(NSDictionary<id, UIView *> *))block;
- (void)addUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass;
- (void)addUIBlock:(void (^)(id))block forView:(id)viewId implementingProtocol:(Protocol *)protocol;
- (void)executeUIBlock:(void (^)(NSDictionary<id, UIView *> *))block;
- (void)executeUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass;
- (void)executeUIBlock:(void (^)(id))block forView:(id)viewId implementingProtocol:(Protocol *)protocol;
- (void)dispatchOnClientThread:(dispatch_block_t)block;

@end
