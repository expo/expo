// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0UMAppLoader/ABI46_0_0UMAppLoaderInterface.h>

#define ABI46_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void ABI46_0_0UMRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    ABI46_0_0UMRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define ABI46_0_0UM_REGISTER_APP_LOADER(loader_name) \
  ABI46_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface ABI46_0_0UMAppLoaderProvider : NSObject

- (nullable id<ABI46_0_0UMAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
