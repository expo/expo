// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI42_0_0EXDeviceType) {
    ABI42_0_0EXDeviceTypeUnknown = 0,
    ABI42_0_0EXDeviceTypePhone,
    ABI42_0_0EXDeviceTypeTablet,
    ABI42_0_0EXDeviceTypeDesktop,
    ABI42_0_0EXDeviceTypeTV,
};

@interface ABI42_0_0EXDevice : ABI42_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
