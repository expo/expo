// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXBarCodeScanner/ABI39_0_0EXBarCodeScannerProvider.h>
#import <ABI39_0_0EXBarCodeScanner/ABI39_0_0EXBarCodeScanner.h>

@implementation ABI39_0_0EXBarCodeScannerProvider

ABI39_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI39_0_0UMBarCodeScannerProviderInterface)];
}

- (id<ABI39_0_0UMBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI39_0_0EXBarCodeScanner new];
}

@end
