// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXBarCodeScanner/ABI42_0_0EXBarCodeScannerProvider.h>
#import <ABI42_0_0EXBarCodeScanner/ABI42_0_0EXBarCodeScanner.h>

@implementation ABI42_0_0EXBarCodeScannerProvider

ABI42_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI42_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI42_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI42_0_0EXBarCodeScanner new];
}

@end
