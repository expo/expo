// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXBarCodeScanner/ABI31_0_0EXBarCodeScannerProvider.h>
#import <ABI31_0_0EXBarCodeScanner/ABI31_0_0EXBarCodeScanner.h>

@implementation ABI31_0_0EXBarCodeScannerProvider

ABI31_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI31_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI31_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI31_0_0EXBarCodeScanner new];
}

@end
