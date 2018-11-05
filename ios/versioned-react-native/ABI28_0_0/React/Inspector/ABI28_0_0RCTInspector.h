// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTDefines.h>

#if ABI28_0_0RCT_DEV

@class ABI28_0_0RCTInspectorRemoteConnection;

@interface ABI28_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI28_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI28_0_0RCTInspector : NSObject
+ (NSArray<ABI28_0_0RCTInspectorPage *> *)pages;
+ (ABI28_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI28_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
