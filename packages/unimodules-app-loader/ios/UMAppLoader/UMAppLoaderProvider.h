// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMAppLoader/UMAppLoaderInterface.h>

#define UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void UMRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    UMRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define UM_REGISTER_APP_LOADER(loader_name) \
  UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface UMAppLoaderProvider : NSObject

- (nullable id<UMAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
