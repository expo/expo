// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI40_0_0EXDeviceType) {
    ABI40_0_0EXDeviceTypeUnknown = 0,
    ABI40_0_0EXDeviceTypePhone,
    ABI40_0_0EXDeviceTypeTablet,
    ABI40_0_0EXDeviceTypeDesktop,
    ABI40_0_0EXDeviceTypeTV,
};

@interface ABI40_0_0EXDevice : ABI40_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
