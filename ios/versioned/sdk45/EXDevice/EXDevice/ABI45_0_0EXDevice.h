// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI45_0_0EXDeviceType) {
    ABI45_0_0EXDeviceTypeUnknown = 0,
    ABI45_0_0EXDeviceTypePhone,
    ABI45_0_0EXDeviceTypeTablet,
    ABI45_0_0EXDeviceTypeDesktop,
    ABI45_0_0EXDeviceTypeTV,
};

@interface ABI45_0_0EXDevice : ABI45_0_0EXExportedModule

@end

NS_ASSUME_NONNULL_END
