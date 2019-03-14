// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/EXFontLoader.h>
#import <EXFont/EXFontLoaderProcessor.h>
#import <UMFontInterface/UMFontManagerInterface.h>
#import <EXFont/EXFontScaler.h>
#import <EXFont/EXFont.h>
#import <objc/runtime.h>
#import <EXFont/EXFontManager.h>
#import <EXFont/EXFontScalersManager.h>

@interface EXFontLoader ()

@property (nonatomic, strong) EXFontScaler *scaler;
@property (nonatomic, strong) EXFontLoaderProcessor *processor;

@end

@implementation EXFontLoader

UM_EXPORT_MODULE(ExpoFontLoader);

- (instancetype)init
{
  if (self = [super init]) {
    _scaler = [[EXFontScaler alloc] init];
    _processor = [[EXFontLoaderProcessor alloc] init];
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<UMFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id<UMFontScalersManagerInterface> scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

UM_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if ([EXFontManager getFontForName:fontFamilyName]) {
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

  [EXFontManager setFont:[[EXFont alloc] initWithCGFont:font] forName:fontFamilyName];
  resolve(nil);
}

@end
