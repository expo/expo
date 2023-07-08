// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0UMAppLoader/ABI49_0_0UMAppLoaderProvider.h>
#import <ABI49_0_0UMAppLoader/ABI49_0_0UMAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *ABI49_0_0UMProvidedAppLoaderClasses;

extern void ABI49_0_0UMRegisterAppLoader(NSString *, Class);
extern void ABI49_0_0UMRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(ABI49_0_0UMAppLoaderInterface)]) {
    if (!ABI49_0_0UMProvidedAppLoaderClasses) {
      ABI49_0_0UMProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    ABI49_0_0UMProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"ABI49_0_0UMAppLoader class (%@) doesn't conform to the ABI49_0_0UMAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation ABI49_0_0UMAppLoaderProvider

- (nullable id<ABI49_0_0UMAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = ABI49_0_0UMProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static ABI49_0_0UMAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[ABI49_0_0UMAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
