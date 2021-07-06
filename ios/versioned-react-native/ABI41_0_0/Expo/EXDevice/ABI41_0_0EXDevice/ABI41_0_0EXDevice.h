// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI41_0_0EXDeviceType) {
    ABI41_0_0EXDeviceTypeUnknown = 0,
    ABI41_0_0EXDeviceTypePhone,
    ABI41_0_0EXDeviceTypeTablet,
    ABI41_0_0EXDeviceTypeDesktop,
    ABI41_0_0EXDeviceTypeTV,
};

@interface ABI41_0_0EXDevice : ABI41_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
