/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <CoreVideo/CoreVideo.h>
#import "ZXByteArray.h"
#import "ZXCGImageLuminanceSource.h"
#import "ZXImage.h"
#import "ZXDecodeHints.h"

@interface ZXCGImageLuminanceSource ()

@property (nonatomic, assign, readonly) CGImageRef image;
@property (nonatomic, assign, readonly) int8_t *data;
@property (nonatomic, assign, readonly) size_t left;
@property (nonatomic, assign, readonly) size_t top;
@property (nonatomic, assign, readonly) ZXCGImageLuminanceSourceInfo *sourceInfo;

@end

@implementation ZXCGImageLuminanceSource

+ (CGImageRef)createImageFromBuffer:(CVImageBufferRef)buffer CF_RETURNS_RETAINED {
  return [self createImageFromBuffer:buffer
                                left:0
                                 top:0
                               width:CVPixelBufferGetWidth(buffer)
                              height:CVPixelBufferGetHeight(buffer)];
}

+ (CGImageRef)createImageFromBuffer:(CVImageBufferRef)buffer
                               left:(size_t)left
                                top:(size_t)top
                              width:(size_t)width
                             height:(size_t)height CF_RETURNS_RETAINED {
  size_t bytesPerRow = CVPixelBufferGetBytesPerRow(buffer);
  size_t dataWidth = CVPixelBufferGetWidth(buffer);
  size_t dataHeight = CVPixelBufferGetHeight(buffer);
  
  if (left + width > dataWidth ||
      top + height > dataHeight) {
    [NSException raise:NSInvalidArgumentException format:@"Crop rectangle does not fit within image data."];
  }
  
  size_t newBytesPerRow = ((width*4+0xf)>>4)<<4;
  
  CVPixelBufferLockBaseAddress(buffer,0);
  
  int8_t *baseAddress = (int8_t *)CVPixelBufferGetBaseAddress(buffer);
  
  size_t size = newBytesPerRow*height;
  int8_t *bytes = (int8_t *)malloc(size * sizeof(int8_t));
  if (newBytesPerRow == bytesPerRow) {
    memcpy(bytes, baseAddress+top*bytesPerRow, size * sizeof(int8_t));
  } else {
    for (int y=0; y<height; y++) {
      memcpy(bytes+y*newBytesPerRow,
             baseAddress+left*4+(top+y)*bytesPerRow,
             newBytesPerRow * sizeof(int8_t));
    }
  }
  CVPixelBufferUnlockBaseAddress(buffer, 0);
  
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef newContext = CGBitmapContextCreate(bytes,
                                                  width,
                                                  height,
                                                  8,
                                                  newBytesPerRow,
                                                  colorSpace,
                                                  kCGBitmapByteOrder32Little|
                                                  kCGImageAlphaNoneSkipFirst);
  CGColorSpaceRelease(colorSpace);
  
  CGImageRef result = CGBitmapContextCreateImage(newContext);
  
  CGContextRelease(newContext);
  
  free(bytes);
  
  return result;
}

- (id)initWithZXImage:(ZXImage *)image
                 left:(size_t)left
                  top:(size_t)top
                width:(size_t)width
               height:(size_t)height {
  return [self initWithCGImage:image.cgimage left:left top:top width:width height:height];
}

- (id)initWithZXImage:(ZXImage *)image {
  return [self initWithCGImage:image.cgimage];
}

- (id)initWithCGImage:(CGImageRef)image
                 left:(size_t)left
                  top:(size_t)top
                width:(size_t)width
               height:(size_t)height {
  if (self = [super initWithWidth:(int)width height:(int)height]) {
    [self initializeWithImage:image left:left top:top width:width height:height];
  }
  
  return self;
}

- (id)initWithCGImage:(CGImageRef)image {
  return [self initWithCGImage:image left:0 top:0 width:CGImageGetWidth(image) height:CGImageGetHeight(image)];
}

- (id)initWithCGImage:(CGImageRef)image sourceInfo: (ZXCGImageLuminanceSourceInfo *)sourceInfo {
  size_t width = CGImageGetWidth(image);
  size_t height = CGImageGetHeight(image);
  
  if (self = [super initWithWidth:(int)width height:(int)height]) {
    _sourceInfo = sourceInfo;
    [self initializeWithImage:image left: 0 top: 0 width:width height:height];
  }
  
  return self;
}

- (id)initWithBuffer:(CVPixelBufferRef)buffer
                left:(size_t)left
                 top:(size_t)top
               width:(size_t)width
              height:(size_t)height {
  CGImageRef image = [ZXCGImageLuminanceSource createImageFromBuffer:buffer left:left top:top width:width height:height];
  
  self = [self initWithCGImage:image];
  
  CGImageRelease(image);
  
  return self;
}

- (id)initWithBuffer:(CVPixelBufferRef)buffer {
  CGImageRef image = [ZXCGImageLuminanceSource createImageFromBuffer:buffer];
  
  self = [self initWithCGImage:image];
  
  CGImageRelease(image);
  
  return self;
}

- (void)dealloc {
  if (_image) {
    CGImageRelease(_image);
  }
  if (_data) {
    free(_data);
  }
}

- (ZXByteArray *)rowAtY:(int)y row:(ZXByteArray *)row {
  if (y < 0 || y >= self.height) {
    [NSException raise:NSInvalidArgumentException format:@"Requested row is outside the image: %d", y];
  }
  
  if (!row || row.length < self.width) {
    row = [[ZXByteArray alloc] initWithLength:self.width];
  }
  int offset = y * self.width;
  memcpy(row.array, self.data + offset, self.width * sizeof(int8_t));
  return row;
}

- (ZXByteArray *)matrix {
  int area = self.width * self.height;
  
  ZXByteArray *matrix = [[ZXByteArray alloc] initWithLength:area];
  memcpy(matrix.array, self.data, area * sizeof(int8_t));
  return matrix;
}

- (void)initializeWithImage:(CGImageRef)cgimage left:(size_t)left top:(size_t)top width:(size_t)width height:(size_t)height {
  _data = 0;
  _image = CGImageRetain(cgimage);
  _left = left;
  _top = top;
  size_t sourceWidth = CGImageGetWidth(cgimage);
  size_t sourceHeight = CGImageGetHeight(cgimage);
  size_t selfWidth = self.width;
  size_t selfHeight= self.height;
  
  if (left + selfWidth > sourceWidth ||
      top + selfHeight > sourceHeight) {
    [NSException raise:NSInvalidArgumentException format:@"Crop rectangle does not fit within image data."];
  }
  
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(NULL, selfWidth, selfHeight, 8, selfWidth * 4, colorSpace, kCGBitmapByteOrder32Little | kCGImageAlphaPremultipliedLast);
  CGColorSpaceRelease(colorSpace);
  
  CGContextSetAllowsAntialiasing(context, FALSE);
  CGContextSetInterpolationQuality(context, kCGInterpolationNone);
  
  if (top || left) {
    CGContextClipToRect(context, CGRectMake(0, 0, selfWidth, selfHeight));
  }
  
  CGContextDrawImage(context, CGRectMake(-left, -top, selfWidth, selfHeight), self.image);
  
  uint32_t *pixelData = CGBitmapContextGetData(context);
  
  _data = (int8_t *)malloc(selfWidth * selfHeight * sizeof(int8_t));
  
  dispatch_apply(selfHeight, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0), ^(size_t idx) {
    size_t stripe_start = idx * selfWidth;
    size_t stripe_stop = stripe_start + selfWidth;
    
    for (size_t i = stripe_start; i < stripe_stop; i++) {
      uint32_t rgbPixelIn = pixelData[i];
      uint32_t rgbPixelOut = 0;
      
      uint32_t red = (rgbPixelIn >> 24) & 0xFF;
      uint32_t green = (rgbPixelIn >> 16) & 0xFF;
      uint32_t blue = (rgbPixelIn >> 8) & 0xFF;
      uint32_t alpha = (rgbPixelIn & 0xFF);
      
      // ImageIO premultiplies all PNGs, so we have to "un-premultiply them":
      // http://code.google.com/p/cocos2d-iphone/issues/detail?id=697#c26
      if (alpha != 0xFF) {
        red   =   red > 0 ? ((red   << 20) / (alpha << 2)) >> 10 : 0;
        green = green > 0 ? ((green << 20) / (alpha << 2)) >> 10 : 0;
        blue  =  blue > 0 ? ((blue  << 20) / (alpha << 2)) >> 10 : 0;
      }
      
      if (red == green && green == blue) {
        rgbPixelOut = red;
      } else {
        rgbPixelOut = [self calculateRed:red green:green blue:blue];
      }
      
      if (rgbPixelOut > 255) {
        rgbPixelOut = 255;
      }
      
      // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
      // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
      // barcode image. Force any such pixel to be white:
      if (rgbPixelOut == 0 && alpha == 0) {
        rgbPixelOut = 255;
      }
      
      self->_data[i] = rgbPixelOut;
    }
  });
  
  CGContextRelease(context);
  
  _top = top;
  _left = left;
}

- (uint32_t)calculateRed:(uint32_t)red green:(uint32_t)green blue:(uint32_t)blue {
  // Normal formula
  if (_sourceInfo == nil || _sourceInfo.type == ZXCGImageLuminanceSourceNormal) {
    uint32_t ret = (306 * red + 601 * green + 117 * blue + (0x200)) >> 10; // 0x200 = 1<<9, half an lsb of the result to force rounding
    return ret;
  }
  
  switch (_sourceInfo.type) {
    case ZXCGImageLuminanceSourceLuma: {
      uint32_t result = (red * 0.2126 + green * 0.7152 + blue * 0.0722);
      return result;
    }
      
      // shades formula - ref: http://www.tannerhelland.com/3643/grayscale-image-algorithm-vb6/
    case ZXCGImageLuminanceSourceShades: {
      if (_sourceInfo.numberOfShades > 1) {
        float conversationFactor = 255.0 / (_sourceInfo.numberOfShades - 1);
        float averageValue = (red + green + blue) / 3.0;
        uint32_t result = ((averageValue / conversationFactor) + 0.5) * conversationFactor;
        return result;
      }
      
      return 0;
    }
      
    case ZXCGImageLuminanceSourceDigital:
      return green;
      
    case ZXCGImageLuminanceSourceDecomposingMin:
      return MIN(MIN(red, green), blue);
      
    case ZXCGImageLuminanceSourceDecomposingMax:
      return MAX(MAX(red, green), blue);
      
    default:
      return 0;
  }
}

- (BOOL)rotateSupported {
  return YES;
}

- (ZXLuminanceSource *)rotateCounterClockwise {
  double radians = 270.0f * M_PI / 180;
  
#if TARGET_OS_EMBEDDED || TARGET_IPHONE_SIMULATOR
  radians = -1 * radians;
#endif
  
  int sourceWidth = self.width;
  int sourceHeight = self.height;
  
  CGRect imgRect = CGRectMake(0, 0, sourceWidth, sourceHeight);
  CGAffineTransform transform = CGAffineTransformMakeRotation(radians);
  CGRect rotatedRect = CGRectApplyAffineTransform(imgRect, transform);
  
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(NULL,
                                               rotatedRect.size.width,
                                               rotatedRect.size.height,
                                               8,
                                               0,
                                               colorSpace,
                                               kCGBitmapAlphaInfoMask & kCGImageAlphaPremultipliedFirst);
  CGContextSetAllowsAntialiasing(context, FALSE);
  CGContextSetInterpolationQuality(context, kCGInterpolationNone);
  CGColorSpaceRelease(colorSpace);
  
  CGContextTranslateCTM(context,
                        +(rotatedRect.size.width/2),
                        +(rotatedRect.size.height/2));
  CGContextRotateCTM(context, radians);
  
  CGContextDrawImage(context, CGRectMake(-imgRect.size.width/2,
                                         -imgRect.size.height/2,
                                         imgRect.size.width,
                                         imgRect.size.height),
                     self.image);
  
  CGImageRef rotatedImage = CGBitmapContextCreateImage(context);
  
  CFRelease(context);
  
  ZXCGImageLuminanceSource *result = [[ZXCGImageLuminanceSource alloc] initWithCGImage:rotatedImage
                                                                                  left:self.top
                                                                                   top:sourceWidth - (self.left + self.width)
                                                                                 width:self.height
                                                                                height:self.width];
  
  CGImageRelease(rotatedImage);
  
  return result;
}

- (ZXLuminanceSource *)crop:(int)left top:(int)top width:(int)width height:(int)height {
  CGImageRef croppedImageRef = CGImageCreateWithImageInRect(self.image, CGRectMake(left, top, width, height));
  ZXCGImageLuminanceSource *result = [[ZXCGImageLuminanceSource alloc] initWithCGImage:croppedImageRef];
  CGImageRelease(croppedImageRef);
  return result;
}

@end
