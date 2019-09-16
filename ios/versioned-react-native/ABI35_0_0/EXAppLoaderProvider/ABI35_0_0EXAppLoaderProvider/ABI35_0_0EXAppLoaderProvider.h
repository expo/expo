// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXAppLoaderProvider/ABI35_0_0EXAppLoaderInterface.h>

#define ABI35_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void ABI35_0_0EXRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    ABI35_0_0EXRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define ABI35_0_0UM_REGISTER_APP_LOADER(loader_name) \
  ABI35_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface ABI35_0_0EXAppLoaderProvider : NSObject

- (nullable id<ABI35_0_0EXAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
