// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/EXFontLoader.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXFont/EXFontLoaderProcessor.h>
#import <EXFontInterface/EXFontManagerInterface.h>
#import <EXFont/EXFont.h>
#import <objc/runtime.h>
#import <EXFont/UIFont+EXFontLoader.h>
#import <EXFont/EXFontManager.h>

@interface EXFontLoader ()

@property (nonatomic, assign) BOOL isInForeground;
@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;

@end

@implementation EXFontLoader

EX_EXPORT_MODULE(ExpoFontLoader);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }

  _lifecycleManager = nil;

  if (moduleRegistry) {
    id<EXFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFontManagerInterface)];
    [manager addFontProccessor:[[EXFontLoaderProcessor alloc] init]];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXAppLifecycleService)];
  }

  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

- (void)dealloc
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
}

EX_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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

#pragma mark - internal

- (void)_swizzleUIFont
{
  SEL a = @selector(EXFontWithSize:);
  SEL b = @selector(fontWithSize:);
  method_exchangeImplementations(class_getInstanceMethod([UIFont class], a),
                                 class_getInstanceMethod([UIFont class], b));
}

- (void)onAppForegrounded
{
  if (!_isInForeground) {
    [self _swizzleUIFont];
    _isInForeground = YES;
  }
}

- (void)onAppBackgrounded
{
  if (_isInForeground) {
    _isInForeground = NO;
    [self _swizzleUIFont];
  }
}

@end
