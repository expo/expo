// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0UMAppLoader/ABI45_0_0UMAppLoaderInterface.h>

#define ABI45_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name, _custom_load_code) \
  extern void ABI45_0_0UMRegisterAppLoader(NSString *, Class); \
  + (void)load { \
    ABI45_0_0UMRegisterAppLoader(@#loader_name, self); \
    _custom_load_code \
  }

#define ABI45_0_0UM_REGISTER_APP_LOADER(loader_name) \
  ABI45_0_0UM_REGISTER_APP_LOADER_WITH_CUSTOM_LOAD(loader_name,)

@interface ABI45_0_0UMAppLoaderProvider : NSObject

- (nullable id<ABI45_0_0UMAppLoaderInterface>)createAppLoader:(nonnull NSString *)loaderName;

+ (nonnull instancetype)sharedInstance;

@end
