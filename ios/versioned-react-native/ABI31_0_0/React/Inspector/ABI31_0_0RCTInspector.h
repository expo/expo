// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <ReactABI31_0_0/ABI31_0_0RCTDefines.h>

#if ABI31_0_0RCT_DEV

@class ABI31_0_0RCTInspectorRemoteConnection;

@interface ABI31_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI31_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI31_0_0RCTInspector : NSObject
+ (NSArray<ABI31_0_0RCTInspectorPage *> *)pages;
+ (ABI31_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI31_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
