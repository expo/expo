// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXBarCodeScanner/ABI46_0_0EXBarCodeScannerProvider.h>
#import <ABI46_0_0EXBarCodeScanner/ABI46_0_0EXBarCodeScanner.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>

@implementation ABI46_0_0EXBarCodeScannerProvider

ABI46_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI46_0_0EXBarCodeScannerProviderInterface)];
}

- (id<ABI46_0_0EXBarCodeScannerInterface>)createBarCodeScanner
{
  return [ABI46_0_0EXBarCodeScanner new];
}

@end
