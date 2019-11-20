// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI35_0_0EXDeviceType) {
    ABI35_0_0EXDeviceTypeUnknown = 0,
    ABI35_0_0EXDeviceTypePhone,
    ABI35_0_0EXDeviceTypeTablet,
    ABI35_0_0EXDeviceTypeDesktop,
    ABI35_0_0EXDeviceTypeTV,
};

@interface ABI35_0_0EXDevice : ABI35_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
