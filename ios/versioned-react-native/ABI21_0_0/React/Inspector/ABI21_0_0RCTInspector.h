// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI21_0_0/ABI21_0_0RCTDefines.h>

#if ABI21_0_0RCT_DEV

@class ABI21_0_0RCTInspectorRemoteConnection;

@interface ABI21_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI21_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@end

@interface ABI21_0_0RCTInspector : NSObject
+ (NSArray<ABI21_0_0RCTInspectorPage *> *)pages;
+ (ABI21_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI21_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
