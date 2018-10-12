// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppLoaderProvider/EXAppLoaderInterface.h>

#define EX_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void EXRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    EXRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define EX_REGISTER_APP_LOADER(loader_name) \
  EX_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface EXAppLoaderProvider : NSObject

- (nullable id<EXAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
