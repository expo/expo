// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTDefines.h>

#if ABI23_0_0RCT_DEV

@class ABI23_0_0RCTInspectorRemoteConnection;

@interface ABI23_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI23_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@end

@interface ABI23_0_0RCTInspector : NSObject
+ (NSArray<ABI23_0_0RCTInspectorPage *> *)pages;
+ (ABI23_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI23_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
