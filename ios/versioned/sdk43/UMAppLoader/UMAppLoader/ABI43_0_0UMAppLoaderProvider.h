// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0UMAppLoader/ABI43_0_0UMAppLoaderInterface.h>

#define ABI43_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void ABI43_0_0UMRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    ABI43_0_0UMRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define ABI43_0_0UM_REGISTER_APP_LOADER(loader_name) \
  ABI43_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface ABI43_0_0UMAppLoaderProvider : NSObject

- (nullable id<ABI43_0_0UMAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
