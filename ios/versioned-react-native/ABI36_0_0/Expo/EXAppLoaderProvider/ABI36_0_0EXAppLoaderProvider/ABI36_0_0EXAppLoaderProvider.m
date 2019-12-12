// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXAppLoaderProvider/ABI36_0_0EXAppLoaderProvider.h>
#import <ABI36_0_0EXAppLoaderProvider/ABI36_0_0EXAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *ABI36_0_0EXProvidedAppLoaderClasses;

extern void ABI36_0_0EXRegisterAppLoader(NSString *, Class);
extern void ABI36_0_0EXRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(ABI36_0_0EXAppLoaderInterface)]) {
    if (!ABI36_0_0EXProvidedAppLoaderClasses) {
      ABI36_0_0EXProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    ABI36_0_0EXProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"ABI36_0_0EXAppLoader class (%@) doesn't conform to the ABI36_0_0EXAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation ABI36_0_0EXAppLoaderProvider

- (nullable id<ABI36_0_0EXAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = ABI36_0_0EXProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static ABI36_0_0EXAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[ABI36_0_0EXAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
