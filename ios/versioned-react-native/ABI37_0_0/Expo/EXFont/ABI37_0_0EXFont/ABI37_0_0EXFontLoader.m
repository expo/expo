// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXFont/ABI37_0_0EXFontLoader.h>
#import <ABI37_0_0EXFont/ABI37_0_0EXFontLoaderProcessor.h>
#import <ABI37_0_0UMFontInterface/ABI37_0_0UMFontManagerInterface.h>
#import <ABI37_0_0EXFont/ABI37_0_0EXFontScaler.h>
#import <ABI37_0_0EXFont/ABI37_0_0EXFont.h>
#import <objc/runtime.h>
#import <ABI37_0_0EXFont/ABI37_0_0EXFontManager.h>
#import <ABI37_0_0EXFont/ABI37_0_0EXFontScalersManager.h>

@interface ABI37_0_0EXFontLoader ()

@property (nonatomic, strong) ABI37_0_0EXFontScaler *scaler;
@property (nonatomic, strong) ABI37_0_0EXFontLoaderProcessor *processor;
@property (nonatomic, strong) ABI37_0_0EXFontManager *manager;

@end

@implementation ABI37_0_0EXFontLoader

ABI37_0_0UM_EXPORT_MODULE(ExpoFontLoader);

- (instancetype)init
{
  if (self = [super init]) {
    _scaler = [[ABI37_0_0EXFontScaler alloc] init];
    _manager = [[ABI37_0_0EXFontManager alloc] init];
    _processor = [[ABI37_0_0EXFontLoaderProcessor alloc] initWithManager:_manager];
  }
  return self;
}

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
{
  if (self = [super init]) {
    _scaler = [[ABI37_0_0EXFontScaler alloc] init];
    _manager = [[ABI37_0_0EXFontManager alloc] init];
    _processor = [[ABI37_0_0EXFontLoaderProcessor alloc] initWithFontFamilyPrefix:prefix manager:_manager];
  }
  return self;
}


- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<ABI37_0_0UMFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id<ABI37_0_0UMFontScalersManagerInterface> scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

ABI37_0_0UM_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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

  [_manager setFont:[[ABI37_0_0EXFont alloc] initWithCGFont:font] forName:fontFamilyName];
  resolve(nil);
}

@end
