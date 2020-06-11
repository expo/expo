// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMAppLoader/ABI38_0_0UMAppLoaderProvider.h>
#import <ABI38_0_0UMAppLoader/ABI38_0_0UMAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *ABI38_0_0UMProvidedAppLoaderClasses;

extern void ABI38_0_0UMRegisterAppLoader(NSString *, Class);
extern void ABI38_0_0UMRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(ABI38_0_0UMAppLoaderInterface)]) {
    if (!ABI38_0_0UMProvidedAppLoaderClasses) {
      ABI38_0_0UMProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    ABI38_0_0UMProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"ABI38_0_0UMAppLoader class (%@) doesn't conform to the ABI38_0_0UMAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation ABI38_0_0UMAppLoaderProvider

- (nullable id<ABI38_0_0UMAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = ABI38_0_0UMProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static ABI38_0_0UMAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[ABI38_0_0UMAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
