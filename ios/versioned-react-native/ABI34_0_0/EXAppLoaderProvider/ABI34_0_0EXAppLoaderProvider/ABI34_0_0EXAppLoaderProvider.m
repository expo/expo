// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXAppLoaderProvider/ABI34_0_0EXAppLoaderProvider.h>
#import <ABI34_0_0EXAppLoaderProvider/ABI34_0_0EXAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *ABI34_0_0EXProvidedAppLoaderClasses;

extern void ABI34_0_0EXRegisterAppLoader(NSString *, Class);
extern void ABI34_0_0EXRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(ABI34_0_0EXAppLoaderInterface)]) {
    if (!ABI34_0_0EXProvidedAppLoaderClasses) {
      ABI34_0_0EXProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    ABI34_0_0EXProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"ABI34_0_0EXAppLoader class (%@) doesn't conform to the ABI34_0_0EXAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation ABI34_0_0EXAppLoaderProvider

- (nullable id<ABI34_0_0EXAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = ABI34_0_0EXProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static ABI34_0_0EXAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[ABI34_0_0EXAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
