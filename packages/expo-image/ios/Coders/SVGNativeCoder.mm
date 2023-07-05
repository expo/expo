//
//  SDImageSVGNativeCoder.mm
//  SDWebImageSVGNativeCoder
//
//  Created by dreampiggy on 08/01/2022.
//  Copyright (c) 2022 dreampiggy. All rights reserved.
//

#import <ExpoImage/SVGNativeCoder.h>
#import <ExpoImage/SVGDocument.h>
#import <ExpoImage/ports/cg/CGSVGRenderer.h>

#define kSVGTagEnd @"</svg>"

static SDImageCoderOption const SDImageCoderSvgColorMap = @"svgColorMap";

@implementation SDImageSVGNativeCoder

+ (SDImageSVGNativeCoder *)sharedCoder {
    static dispatch_once_t onceToken;
    static SDImageSVGNativeCoder *coder;
    dispatch_once(&onceToken, ^{
        coder = [[SDImageSVGNativeCoder alloc] init];
    });
    return coder;
}

#pragma mark - Decode

- (BOOL)canDecodeFromData:(NSData *)data {
    return [self.class isSVGFormatForData:data];
}

- (nullable UIImage *)decodedImageWithData:(nullable NSData *)data options:(nullable SDImageCoderOptions *)options {
    if (!data) {
        return nil;
    }
    NSString *svgString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (!svgString) {
        return nil;
    }
    
    // Parse args
    CGSize imageSize = CGSizeZero;
    BOOL preserveAspectRatio = YES;
    if (options[SDImageCoderDecodeThumbnailPixelSize]) {
        NSValue *sizeValue = options[SDImageCoderDecodeThumbnailPixelSize];
#if SD_MAC
        imageSize = sizeValue.sizeValue;
#else
        imageSize = sizeValue.CGSizeValue;
#endif
    }
    if (options[SDImageCoderDecodePreserveAspectRatio]) {
        preserveAspectRatio = [options[SDImageCoderDecodePreserveAspectRatio] boolValue];
    }
    
    // From svg-native-viewer example/testCocoaCG, use C++ shared ptr
    // Create the renderer object
    auto renderer = std::make_shared<SVGNative::CGSVGRenderer>();

    // Create SVGDocument object and parse the passed SVG string.
    auto doc = SVGNative::SVGDocument::CreateSVGDocument([svgString UTF8String], renderer).release();
    if (!doc) {
        return nil;
    }
    
    CGSize svgSize = CGSizeMake(100, 100);//imageSize;
    if (CGSizeEqualToSize(svgSize, CGSizeZero)) {
        // If user don't provide view port size, use the view box size
        svgSize = CGSizeMake(doc->Width(), doc->Height());
    }

    // Draw on CGContext
    SDGraphicsBeginImageContext(svgSize);
    CGContextRef ctx = SDGraphicsGetCurrentContext();
    
    renderer->SetGraphicsContext(ctx);


  SVGNative::ColorMap svgNativeColorMap = {};
  NSDictionary<NSString *, UIColor *> *colorMap = options[SDImageCoderSvgColorMap];

  if (colorMap != nil) {
    for (NSString *colorName in colorMap) {
      UIColor *color = colorMap[colorName];

      CGFloat red, green, blue, alpha;
      [color getRed:&red green:&green blue:&blue alpha:&alpha];

      svgNativeColorMap.insert({
        std::string([colorName UTF8String]),
        {{ (float)red, (float)green, (float)blue, (float)alpha }}
      });
    }
  }

    doc->Render(svgNativeColorMap, svgSize.width, svgSize.height);

    renderer->ReleaseGraphicsContext();
    UIImage *image = SDGraphicsGetImageFromCurrentImageContext();
    SDGraphicsEndImageContext();
    
    return image;
}

#pragma mark - Encode

// No support SVG Encode
- (BOOL)canEncodeToFormat:(SDImageFormat)format {
    return NO;
}

- (nullable NSData *)encodedDataWithImage:(nullable UIImage *)image format:(SDImageFormat)format options:(nullable SDImageCoderOptions *)options {
    return nil;
}

#pragma mark - Helper

+ (BOOL)isSVGFormatForData:(NSData *)data {
    if (!data) {
        return NO;
    }
    // Check end with SVG tag
    return [data rangeOfData:[kSVGTagEnd dataUsingEncoding:NSUTF8StringEncoding] options:NSDataSearchBackwards range: NSMakeRange(data.length - MIN(100, data.length), MIN(100, data.length))].location != NSNotFound;
}

@end
