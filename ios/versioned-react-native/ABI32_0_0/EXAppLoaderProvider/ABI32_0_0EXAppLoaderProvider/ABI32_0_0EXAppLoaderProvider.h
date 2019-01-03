// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXAppLoaderProvider/ABI32_0_0EXAppLoaderInterface.h>

#define ABI32_0_0EX_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void ABI32_0_0EXRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    ABI32_0_0EXRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define ABI32_0_0EX_REGISTER_APP_LOADER(loader_name) \
  ABI32_0_0EX_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface ABI32_0_0EXAppLoaderProvider : NSObject

- (nullable id<ABI32_0_0EXAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
