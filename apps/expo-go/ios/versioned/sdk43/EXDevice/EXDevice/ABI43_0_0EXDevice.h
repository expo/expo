// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI43_0_0EXDeviceType) {
    ABI43_0_0EXDeviceTypeUnknown = 0,
    ABI43_0_0EXDeviceTypePhone,
    ABI43_0_0EXDeviceTypeTablet,
    ABI43_0_0EXDeviceTypeDesktop,
    ABI43_0_0EXDeviceTypeTV,
};

@interface ABI43_0_0EXDevice : ABI43_0_0EXExportedModule

@end

NS_ASSUME_NONNULL_END
