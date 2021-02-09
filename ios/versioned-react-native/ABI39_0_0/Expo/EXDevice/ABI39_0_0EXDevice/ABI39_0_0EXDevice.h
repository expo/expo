// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI39_0_0EXDeviceType) {
    ABI39_0_0EXDeviceTypeUnknown = 0,
    ABI39_0_0EXDeviceTypePhone,
    ABI39_0_0EXDeviceTypeTablet,
    ABI39_0_0EXDeviceTypeDesktop,
    ABI39_0_0EXDeviceTypeTV,
};

@interface ABI39_0_0EXDevice : ABI39_0_0UMExportedModule

@end

NS_ASSUME_NONNULL_END
