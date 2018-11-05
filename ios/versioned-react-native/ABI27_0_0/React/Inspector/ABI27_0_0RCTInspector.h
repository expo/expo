// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTDefines.h>

#if ABI27_0_0RCT_DEV

@class ABI27_0_0RCTInspectorRemoteConnection;

@interface ABI27_0_0RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface ABI27_0_0RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface ABI27_0_0RCTInspector : NSObject
+ (NSArray<ABI27_0_0RCTInspectorPage *> *)pages;
+ (ABI27_0_0RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(ABI27_0_0RCTInspectorRemoteConnection *)remote;
@end

#endif
