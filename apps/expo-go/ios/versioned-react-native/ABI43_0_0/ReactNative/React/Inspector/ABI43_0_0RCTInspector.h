/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>

#if ABI43_0_0RCT_DEV

@class ABI43_0_0RCTInspectorRemoteConnection;

@interface ABI43_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI43_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI43_0_0RCTInspector : NSObject
+ (NSArray<ABI43_0_0RCTInspectorPage *> *)pages;
+ (ABI43_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI43_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
