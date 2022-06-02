/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0RCTDefines.h>

#if ABI45_0_0RCT_DEV

@class ABI45_0_0RCTInspectorRemoteConnection;

@interface ABI45_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI45_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI45_0_0RCTInspector : NSObject
+ (NSArray<ABI45_0_0RCTInspectorPage *> *)pages;
+ (ABI45_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI45_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
