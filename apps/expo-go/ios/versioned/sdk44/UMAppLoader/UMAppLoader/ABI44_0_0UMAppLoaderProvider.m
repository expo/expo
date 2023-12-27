// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0UMAppLoader/ABI44_0_0UMAppLoaderProvider.h>
#import <ABI44_0_0UMAppLoader/ABI44_0_0UMAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *ABI44_0_0UMProvidedAppLoaderClasses;

extern void ABI44_0_0UMRegisterAppLoader(NSString *, Class);
extern void ABI44_0_0UMRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(ABI44_0_0UMAppLoaderInterface)]) {
    if (!ABI44_0_0UMProvidedAppLoaderClasses) {
      ABI44_0_0UMProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    ABI44_0_0UMProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"ABI44_0_0UMAppLoader class (%@) doesn't conform to the ABI44_0_0UMAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation ABI44_0_0UMAppLoaderProvider

- (nullable id<ABI44_0_0UMAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = ABI44_0_0UMProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static ABI44_0_0UMAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[ABI44_0_0UMAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
