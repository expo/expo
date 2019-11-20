// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXBarCodeScanner/ABI36_0_0EXBarCodeScannerProvider.h>
#import <ABI36_0_0EXBarCodeScanner/ABI36_0_0EXBarCodeScanner.h>

@implementation ABI36_0_0EXBarCodeScannerProvider

ABI36_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI36_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI36_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI36_0_0EXBarCodeScanner new];
}

@end
