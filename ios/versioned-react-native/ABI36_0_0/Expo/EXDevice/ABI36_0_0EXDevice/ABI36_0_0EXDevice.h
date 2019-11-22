// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI36_0_0EXDeviceType) {
    ABI36_0_0EXDeviceTypeUnknown = 0,
    ABI36_0_0EXDeviceTypePhone,
    ABI36_0_0EXDeviceTypeTablet,
    ABI36_0_0EXDeviceTypeDesktop,
    ABI36_0_0EXDeviceTypeTV,
};

@interface ABI36_0_0EXDevice : ABI36_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
