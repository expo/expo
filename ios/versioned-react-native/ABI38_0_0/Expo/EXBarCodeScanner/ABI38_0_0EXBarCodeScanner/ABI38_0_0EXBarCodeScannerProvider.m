// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXBarCodeScanner/ABI38_0_0EXBarCodeScannerProvider.h>
#import <ABI38_0_0EXBarCodeScanner/ABI38_0_0EXBarCodeScanner.h>

@implementation ABI38_0_0EXBarCodeScannerProvider

ABI38_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI38_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI38_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI38_0_0EXBarCodeScanner new];
}

@end
