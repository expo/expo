// Copyright 2015-present 650 Industries. All rights reserved.

@class EXKernelBridgeRecord;

@protocol EXKernelService <NSObject>

@optional
- (void)kernelDidRegisterBridgeWithRecord:(EXKernelBridgeRecord *)record;
- (void)kernelWillUnregisterBridgeWithRecord:(EXKernelBridgeRecord *)record;

@end
