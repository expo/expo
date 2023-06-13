// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI47_0_0EXDeviceType) {
    ABI47_0_0EXDeviceTypeUnknown = 0,
    ABI47_0_0EXDeviceTypePhone,
    ABI47_0_0EXDeviceTypeTablet,
    ABI47_0_0EXDeviceTypeDesktop,
    ABI47_0_0EXDeviceTypeTV,
};

@interface ABI47_0_0EXDevice : ABI47_0_0EXExportedModule

@end

NS_ASSUME_NONNULL_END
