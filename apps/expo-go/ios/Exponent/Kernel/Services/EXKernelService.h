// Copyright 2015-present 650 Industries. All rights reserved.

@class EXKernelAppRecord;

@protocol EXKernelService <NSObject>

@optional
- (void)kernelDidRegisterAppWithRecord:(EXKernelAppRecord *)record;
- (void)kernelWillUnregisterAppWithRecord:(EXKernelAppRecord *)record;

@end
