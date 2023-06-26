// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXFont/ABI49_0_0EXFontLoader.h>
#import <ABI49_0_0EXFont/ABI49_0_0EXFontLoaderProcessor.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXFontManagerInterface.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXFontScalersManagerInterface.h>
#import <ABI49_0_0EXFont/ABI49_0_0EXFontScaler.h>
#import <ABI49_0_0EXFont/ABI49_0_0EXFont.h>
#import <objc/runtime.h>
#import <ABI49_0_0EXFont/ABI49_0_0EXFontManager.h>
#import <ABI49_0_0EXFont/ABI49_0_0EXFontScalersManager.h>

@interface ABI49_0_0EXFontLoader ()

@property (nonatomic, strong) ABI49_0_0EXFontScaler *scaler;
@property (nonatomic, strong) ABI49_0_0EXFontLoaderProcessor *processor;
@property (nonatomic, strong) ABI49_0_0EXFontManager *manager;

@end

@implementation ABI49_0_0EXFontLoader

ABI49_0_0EX_EXPORT_MODULE(ExpoFontLoader);

- (instancetype)init
{
  if (self = [super init]) {
    _scaler = [[ABI49_0_0EXFontScaler alloc] init];
    _manager = [[ABI49_0_0EXFontManager alloc] init];
    _processor = [[ABI49_0_0EXFontLoaderProcessor alloc] initWithManager:_manager];
  }
  return self;
}

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
{
  if (self = [super init]) {
    _scaler = [[ABI49_0_0EXFontScaler alloc] init];
    _manager = [[ABI49_0_0EXFontManager alloc] init];
    _processor = [[ABI49_0_0EXFontLoaderProcessor alloc] initWithFontFamilyPrefix:prefix manager:_manager];
  }
  return self;
}


- (void)setModuleRegistry:(ABI49_0_0EXModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<ABI49_0_0EXFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI49_0_0EXFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id<ABI49_0_0EXFontScalersManagerInterface> scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

ABI49_0_0EX_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(ABI49_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  if ([_manager fontForName:fontFamilyName]) {
    reject(@"E_FONT_ALREADY_EXISTS",
           [NSString stringWithFormat:@"Font with family name '%@' already loaded", fontFamilyName],
           nil);
    return;
  }

  // TODO(nikki): make sure path is in experience's scope
  NSURL *uriString = [[NSURL alloc] initWithString:path];
  NSData *data = [[NSFileManager defaultManager] contentsAtPath:[uriString path]];
  if (!data) {
    reject(@"E_FONT_FILE_NOT_FOUND",
           [NSString stringWithFormat:@"File '%@' for font '%@' doesn't exist", path, fontFamilyName],
           nil);
    return;
  }

  CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)data);
  CGFontRef font = CGFontCreateWithDataProvider(provider);
  CGDataProviderRelease(provider);
  if (!font) {
    reject(@"E_FONT_CREATION_FAILED",
           [NSString stringWithFormat:@"Could not create font from loaded data for '%@'", fontFamilyName],
           nil);
    return;
  }

  [_manager setFont:[[ABI49_0_0EXFont alloc] initWithCGFont:font] forName:fontFamilyName];
  resolve(nil);
}

@end
