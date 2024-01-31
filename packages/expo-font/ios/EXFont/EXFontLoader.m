// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreText/CoreText.h>
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

EX_EXPORT_MODULE(ExpoFontLoader);

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


- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    id<EXFontManagerInterface> manager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFontManagerInterface)];
    [manager addFontProcessor:_processor];

    id<EXFontScalersManagerInterface> scalersManager = [moduleRegistry getSingletonModuleForName:@"FontScalersManager"];
    [scalersManager registerFontScaler:_scaler];
  }
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"customNativeFonts": [self queryCustomNativeFonts],
  };
}

EX_EXPORT_METHOD_AS(loadAsync,
                    loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                    withLocalUri:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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

#pragma mark - Internals

/**
 * Queries custom native font names from the Info.plist `UIAppFonts`.
 */
- (NSArray<NSString *> *)queryCustomNativeFonts {
  #if TARGET_OS_IOS || TARGET_OS_TV
  // [0] Read from main bundle's Info.plist
  NSArray *fontFilePaths = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIAppFonts"];
  NSMutableSet<NSString *> *fontFamilies = [[NSMutableSet alloc] init];

  // [1] Get font family names for each font file
  for (NSString *fontFilePath in fontFilePaths) {
    NSURL *fontURL = [[NSBundle mainBundle] URLForResource:fontFilePath withExtension:nil];
    if (fontURL) {
      CFArrayRef fontDescriptors = CTFontManagerCreateFontDescriptorsFromURL((__bridge CFURLRef)fontURL);
      if (fontDescriptors) {
        CFIndex count = CFArrayGetCount(fontDescriptors);
        for (CFIndex i = 0; i < count; ++i) {
          CTFontDescriptorRef descriptor = (CTFontDescriptorRef)CFArrayGetValueAtIndex(fontDescriptors, i);
          CFStringRef familyNameRef = (CFStringRef)CTFontDescriptorCopyAttribute(descriptor, kCTFontFamilyNameAttribute);
          if (familyNameRef) {
            [fontFamilies addObject:(__bridge_transfer NSString *)familyNameRef];
          }
        }
        CFRelease(fontDescriptors);
      }
    }
  }

  // [2] Retrieve font names by family names
  NSMutableSet<NSString *> *fontNames = [[NSMutableSet alloc] init];
  for (NSString *familyName in fontFamilies) {
    for (NSString *fontName in [UIFont fontNamesForFamilyName:familyName]) {
      [fontNames addObject:fontName];
    }
  }

  // [3] Return as array
  return [fontNames allObjects];
  #elif TARGET_OS_OSX
  // TODO: Add support for `ATSApplicationFontsPath` key in Info.plist
  return @[];
  #endif
}

@end
