// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0UMAppLoader/ABI48_0_0UMAppLoaderProvider.h>
#import <ABI48_0_0UMAppLoader/ABI48_0_0UMAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *ABI48_0_0UMProvidedAppLoaderClasses;

extern void ABI48_0_0UMRegisterAppLoader(NSString *, Class);
extern void ABI48_0_0UMRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(ABI48_0_0UMAppLoaderInterface)]) {
    if (!ABI48_0_0UMProvidedAppLoaderClasses) {
      ABI48_0_0UMProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    ABI48_0_0UMProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"ABI48_0_0UMAppLoader class (%@) doesn't conform to the ABI48_0_0UMAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation ABI48_0_0UMAppLoaderProvider

- (nullable id<ABI48_0_0UMAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = ABI48_0_0UMProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static ABI48_0_0UMAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[ABI48_0_0UMAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
