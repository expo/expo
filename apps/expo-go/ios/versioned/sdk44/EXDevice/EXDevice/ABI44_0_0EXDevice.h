// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI44_0_0EXDeviceType) {
    ABI44_0_0EXDeviceTypeUnknown = 0,
    ABI44_0_0EXDeviceTypePhone,
    ABI44_0_0EXDeviceTypeTablet,
    ABI44_0_0EXDeviceTypeDesktop,
    ABI44_0_0EXDeviceTypeTV,
};

@interface ABI44_0_0EXDevice : ABI44_0_0EXExportedModule

@end

NS_ASSUME_NONNULL_END
