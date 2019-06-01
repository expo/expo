// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXFont/ABI33_0_0EXFontLoader.h>
#import <ABI33_0_0EXFont/ABI33_0_0EXFontLoaderProcessor.h>
#import <ABI33_0_0UMFontInterface/ABI33_0_0UMFontManagerInterface.h>
#import <ABI33_0_0EXFont/ABI33_0_0EXFontScaler.h>
#import <ABI33_0_0EXFont/ABI33_0_0EXFont.h>
#import <objc/runtime.h>
#import <ABI33_0_0EXFont/ABI33_0_0EXFontManager.h>
#import <ABI33_0_0EXFont/ABI33_0_0EXFontScalersManager.h>

@interface ABI33_0_0EXFontLoader ()

@property (nonatomic, strong) ABI33_0_0EXFontScaler *scaler;
@property (nonatomic, strong) ABI33_0_0EXFontLoaderProcessor *processor;

@end

@implementation ABI33_0_0EXFontLoader

ABI33_0_0UM_EXPORT_MODULE(ExpoFontLoader);

- (instancetype)init
{
  if (self = [super init]) {
    _scaler = [[ABI33_0_0EXFontScaler alloc] init];
    _processor = [[ABI33_0_0EXFontLoaderProcessor alloc] init];
  }
  return self;
}

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<ABI33_0_0UMFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI33_0_0UMFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id<ABI33_0_0UMFontScalersManagerInterface> scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

ABI33_0_0UM_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(ABI33_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI33_0_0UMPromiseRejectBlock)reject)
{
  if ([ABI33_0_0EXFontManager getFontForName:fontFamilyName]) {
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

  [ABI33_0_0EXFontManager setFont:[[ABI33_0_0EXFont alloc] initWithCGFont:font] forName:fontFamilyName];
  resolve(nil);
}

@end
