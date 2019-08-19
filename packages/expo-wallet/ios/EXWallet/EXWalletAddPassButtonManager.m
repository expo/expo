// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXWallet/EXWalletAddPassButtonManager.h>
#import <PassKit/PassKit.h>

@interface EXWalletAddPassButtonManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXWalletAddPassButtonManager

UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoWalletAddPassButton";
}

- (NSString *)viewName
{
  return @"ExpoWalletAddPassButton";
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
	// TODO: CUSTOM STYLE
  return [[PKAddPassButton alloc] initWithAddPassButtonStyle:PKAddPassButtonStyleBlack];
}

@end
