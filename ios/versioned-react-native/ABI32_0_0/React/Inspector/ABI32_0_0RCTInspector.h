// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTDefines.h>

#if ABI32_0_0RCT_DEV

@class ABI32_0_0RCTInspectorRemoteConnection;

@interface ABI32_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI32_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI32_0_0RCTInspector : NSObject
+ (NSArray<ABI32_0_0RCTInspectorPage *> *)pages;
+ (ABI32_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI32_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
