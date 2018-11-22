// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXFont/ABI30_0_0EXFontLoader.h>
#import <ABI30_0_0EXFont/ABI30_0_0EXFontLoaderProcessor.h>
#import <ABI30_0_0EXFontInterface/ABI30_0_0EXFontManagerInterface.h>
#import <ABI30_0_0EXFont/ABI30_0_0EXFont.h>
#import <objc/runtime.h>
#import <ABI30_0_0EXFont/ABI30_0_0EXFontManager.h>
#import <ABI30_0_0EXFont/ABI30_0_0EXFontScaler.h>

// Post-versioning addition to integrate ABI30_0_0EXFont with
// EXFontScalersManager singleton module.

@interface ABI30_0_0EXScalersManager

- (void)registerFontScaler:(id)fontScaler;

@end

@interface ABI30_0_0EXFontLoader ()

@property (nonatomic, strong) ABI30_0_0EXFontScaler *scaler;
@property (nonatomic, strong) ABI30_0_0EXFontLoaderProcessor *processor;

@end

@implementation ABI30_0_0EXFontLoader

- (instancetype)init
{
  if (self = [super init]) {
    _scaler = [[ABI30_0_0EXFontScaler alloc] init];
    _processor = [[ABI30_0_0EXFontLoaderProcessor alloc] init];
  }
  return self;
}

ABI30_0_0EX_EXPORT_MODULE(ExpoFontLoader);

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<ABI30_0_0EXFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

ABI30_0_0EX_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  if ([ABI30_0_0EXFontManager getFontForName:fontFamilyName]) {
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

  [ABI30_0_0EXFontManager setFont:[[ABI30_0_0EXFont alloc] initWithCGFont:font] forName:fontFamilyName];
  resolve(nil);
}

@end
