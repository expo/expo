// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, EXDeviceType) {
    EXDeviceTypeUnknown = 0,
    EXDeviceTypePhone,
    EXDeviceTypeTablet,
    EXDeviceTypeDesktop,
    EXDeviceTypeTV,
};

@interface EXDevice : UMExportedModule

@end

NS_ASSUME_NONNULL_END
