// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXAppLoaderProvider/ABI33_0_0EXAppLoaderInterface.h>

#define ABI33_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void ABI33_0_0EXRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    ABI33_0_0EXRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define ABI33_0_0UM_REGISTER_APP_LOADER(loader_name) \
  ABI33_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface ABI33_0_0EXAppLoaderProvider : NSObject

- (nullable id<ABI33_0_0EXAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
