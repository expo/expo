// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI37_0_0EXDeviceType) {
    ABI37_0_0EXDeviceTypeUnknown = 0,
    ABI37_0_0EXDeviceTypePhone,
    ABI37_0_0EXDeviceTypeTablet,
    ABI37_0_0EXDeviceTypeDesktop,
    ABI37_0_0EXDeviceTypeTV,
};

@interface ABI37_0_0EXDevice : ABI37_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
