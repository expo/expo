// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMAppLoader/UMAppLoaderProvider.h>
#import <UMAppLoader/UMAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *UMProvidedAppLoaderClasses;

extern void UMRegisterAppLoader(NSString *, Class);
extern void UMRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(UMAppLoaderInterface)]) {
    if (!UMProvidedAppLoaderClasses) {
      UMProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    UMProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"UMAppLoader class (%@) doesn't conform to the UMAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation UMAppLoaderProvider

- (nullable id<UMAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = UMProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static UMAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[UMAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
