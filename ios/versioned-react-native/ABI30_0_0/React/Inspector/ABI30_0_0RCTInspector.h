// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTDefines.h>

#if ABI30_0_0RCT_DEV

@class ABI30_0_0RCTInspectorRemoteConnection;

@interface ABI30_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI30_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI30_0_0RCTInspector : NSObject
+ (NSArray<ABI30_0_0RCTInspectorPage *> *)pages;
+ (ABI30_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI30_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
