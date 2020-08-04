// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI38_0_0EXDeviceType) {
    ABI38_0_0EXDeviceTypeUnknown = 0,
    ABI38_0_0EXDeviceTypePhone,
    ABI38_0_0EXDeviceTypeTablet,
    ABI38_0_0EXDeviceTypeDesktop,
    ABI38_0_0EXDeviceTypeTV,
};

@interface ABI38_0_0EXDevice : ABI38_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
