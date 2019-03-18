//  Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface EXWebBrowser : UMExportedModule <UMModuleRegistryConsumer>

+ (UIColor *)convertHexColorString:(NSString *)stringToConvert;
+ (UIColor *)colorWithRGBHex:(UInt32)hex;

@end
