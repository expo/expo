// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/EXFontLoader.h>
#import <EXFont/EXFontLoaderProcessor.h>
#import <ExpoModulesCore/EXFontManagerInterface.h>
#import <ExpoModulesCore/EXFontScalersManagerInterface.h>
#import <EXFont/EXFontScaler.h>
#import <EXFont/EXFont.h>
#import <objc/runtime.h>
#import <EXFont/EXFontManager.h>
#import <EXFont/EXFontScalersManager.h>

@interface EXFontLoader ()

@property (nonatomic, strong) EXFontScaler *scaler;
@property (nonatomic, strong) EXFontLoaderProcessor *processor;
@property (nonatomic, strong) EXFontManager *manager;

@end

@implementation EXFontLoader

UM_EXPORT_MODULE(ExpoFontLoader);

- (instancetype)init
{
  if (self = [super init]) {
    _scaler = [[EXFontScaler alloc] init];
    _manager = [[EXFontManager alloc] init];
    _processor = [[EXFontLoaderProcessor alloc] initWithManager:_manager];
  }
  return self;
}

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
{
  if (self = [super init]) {
    _scaler = [[EXFontScaler alloc] init];
    _manager = [[EXFontManager alloc] init];
    _processor = [[EXFontLoaderProcessor alloc] initWithFontFamilyPrefix:prefix manager:_manager];
  }
  return self;
}


- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<EXFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id<EXFontScalersManagerInterface> scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

UM_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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

  [_manager setFont:[[EXFont alloc] initWithCGFont:font] forName:fontFamilyName];
  resolve(nil);
}

@end
