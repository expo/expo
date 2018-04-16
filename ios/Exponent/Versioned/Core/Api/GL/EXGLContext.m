//
//  EXGLContext.h
//  Exponent
//
//  Created by Tomasz Sapeta on 11.01.2018.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import "EXGLContext.h"
#import "EXFileSystem.h"

#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>

#import <React/RCTUIManager.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#import "EXUnversioned.h"

#define BLOCK_SAFE_RUN(block, ...) block ? block(__VA_ARGS__) : nil

@interface EXGLContext ()

@property (nonatomic, strong) dispatch_queue_t glQueue;
@property (nonatomic, weak) EXGLObjectManager *manager;

@end

@interface RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end

@implementation EXGLContext

- (instancetype)initWithDelegate:(id<EXGLContextDelegate>)delegate andManager:(nonnull EXGLObjectManager *)manager
{
  if (self = [super init]) {
    self.delegate = delegate;

    _manager = manager;
    _glQueue = dispatch_queue_create("host.exp.gl", DISPATCH_QUEUE_SERIAL);
    _eaglCtx = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES3] ?: [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];
  }
  return self;
}

- (BOOL)isInitialized
{
  return _contextId != 0;
}

- (EAGLContext *)createSharedEAGLContext
{
  return [[EAGLContext alloc] initWithAPI:[_eaglCtx API] sharegroup:[_eaglCtx sharegroup]];
}

- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback
{
  [EAGLContext setCurrentContext:context];
  callback();
  glFlush();
  [EAGLContext setCurrentContext:nil];
}

- (void)runAsync:(void(^)(void))callback
{
  if (_glQueue) {
    dispatch_async(_glQueue, ^{
      [self runInEAGLContext:_eaglCtx callback:callback];
    });
  }
}

- (void)initialize:(void(^)(BOOL))callback
{
  RCTBridge *bridge = _manager.bridge;

  if (!bridge.executorClass || [NSStringFromClass(bridge.executorClass) isEqualToString:@"RCTJSCExecutor"]) {
    // On JS thread, extract JavaScriptCore context, create EXGL context, call JS callback
    __weak __typeof__(self) weakSelf = self;
    __weak __typeof__(bridge) weakBridge = bridge;

    [bridge dispatchBlock:^{
      __typeof__(self) self = weakSelf;
      __typeof__(bridge) bridge = weakBridge;

      if (!self || !bridge || !bridge.valid) {
        BLOCK_SAFE_RUN(callback, NO);
        return;
      }

      JSGlobalContextRef jsContextRef = [bridge jsContextRef];
      if (!jsContextRef) {
        RCTLogError(@"EXGL: The React Native bridge unexpectedly does not have a JavaScriptCore context.");
        BLOCK_SAFE_RUN(callback, NO);
        return;
      }

      _contextId = UEXGLContextCreate(jsContextRef);
      [_manager saveContext:self];

      UEXGLContextSetFlushMethodObjc(_contextId, ^{
        [self flush];
      });

      if ([self.delegate respondsToSelector:@selector(glContextInitialized:)]) {
        [self.delegate glContextInitialized:self];
      }
      BLOCK_SAFE_RUN(callback, YES);
    } queue:RCTJSThread];
  } else {
    BLOCK_SAFE_RUN(callback, NO);
    RCTLog(@"EXGL: Can only run on JavaScriptCore! Do you have 'Remote Debugging' enabled in your app's Developer Menu (https://facebook.github.io/react-native/docs/debugging.html)? EXGL is not supported while using Remote Debugging, you will need to disable it to use EXGL.");
  }
}

- (void)flush
{
  [self runAsync:^{
    UEXGLContextFlush(_contextId);

    if ([self.delegate respondsToSelector:@selector(glContextFlushed:)]) {
      [self.delegate glContextFlushed:self];
    }
  }];
}

- (void)destroy
{
  [self runAsync:^{
    if ([self.delegate respondsToSelector:@selector(glContextWillDestroy:)]) {
      [self.delegate glContextWillDestroy:self];
    }

    // Flush all the stuff
    UEXGLContextFlush(_contextId);

    // Destroy JS binding
    UEXGLContextDestroy(_contextId);

    // Remove from dictionary of contexts
    [_manager deleteContextWithId:@(_contextId)];
  }];
}

# pragma mark - snapshots

// Saves the contents of the framebuffer to a file.
// Possible options:
// - `flip`: if true, the image will be flipped vertically.
// - `framebuffer`: WebGLFramebuffer that we will be reading from. If not specified, the default framebuffer for this context will be used.
// - `rect`: { x, y, width, height } object used to crop the snapshot.
// - `format`: "jpeg" or "png" - specifies what type of compression and file extension should be used.
// - `compress`: A value in 0 - 1 range specyfing compression level. JPEG format only.
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject
{
  [self flush];
  
  [self runAsync:^{
    NSDictionary *rect = options[@"rect"] ?: [self currentViewport];
    BOOL flip = options[@"flip"] != nil && [options[@"flip"] boolValue];
    NSString *format = options[@"format"];

    int x = [rect[@"x"] intValue];
    int y = [rect[@"y"] intValue];
    int width = [rect[@"width"] intValue];
    int height = [rect[@"height"] intValue];

    // Save surrounding framebuffer
    GLint prevFramebuffer;
    glGetIntegerv(GL_FRAMEBUFFER_BINDING, &prevFramebuffer);

    // Set source framebuffer that we take snapshot from
    GLint sourceFramebuffer = 0;

    if (options[@"framebuffer"] && options[@"framebuffer"][@"id"]) {
      int exglFramebufferId = [options[@"framebuffer"][@"id"] intValue];
      sourceFramebuffer = UEXGLContextGetObject(self.contextId, exglFramebufferId);
    } else {
      // headless context doesn't have default framebuffer, so we use the current one
      sourceFramebuffer = [self defaultFramebuffer] || prevFramebuffer;
    }
    
    if (sourceFramebuffer == 0) {
      reject(
             @"E_GL_NO_FRAMEBUFFER",
             nil,
             RCTErrorWithMessage(@"No framebuffer bound. Create and bind one to take a snapshot from it.")
             );
      return;
    }
    if (width <= 0 || height <= 0) {
      reject(
             @"E_GL_INVALID_VIEWPORT",
             nil,
             RCTErrorWithMessage(@"Rect's width and height must be greater than 0. If you didn't set `rect` option, check if the viewport is set correctly.")
             );
      return;
    }
    
    // Bind source framebuffer
    glBindFramebuffer(GL_FRAMEBUFFER, sourceFramebuffer);

    // Allocate pixel buffer and read pixels
    NSInteger dataLength = width * height * 4;
    GLubyte *buffer = (GLubyte *) malloc(dataLength * sizeof(GLubyte));
    glReadBuffer(GL_COLOR_ATTACHMENT0);
    glReadPixels(x, y, width, height, GL_RGBA, GL_UNSIGNED_BYTE, buffer);

    // Create CGImage
    CGDataProviderRef providerRef = CGDataProviderCreateWithData(NULL, buffer, dataLength, NULL);
    CGColorSpaceRef colorspaceRef = CGColorSpaceCreateDeviceRGB();
    CGImageRef imageRef = CGImageCreate(width, height, 8, 32, width * 4, colorspaceRef, kCGBitmapByteOrder32Big | kCGImageAlphaPremultipliedLast,
                                        providerRef, NULL, true, kCGRenderingIntentDefault);

    // Begin image context
    CGFloat scale = RCTScreenScale();
    NSInteger widthInPoints = width / scale;
    NSInteger heightInPoints = height / scale;
    UIGraphicsBeginImageContextWithOptions(CGSizeMake(widthInPoints, heightInPoints), NO, scale);

    // Flip and draw image to CGImage
    CGContextRef cgContext = UIGraphicsGetCurrentContext();
    if (flip) {
      CGAffineTransform flipVertical = CGAffineTransformMake(1, 0, 0, -1, 0, heightInPoints);
      CGContextConcatCTM(cgContext, flipVertical);
    }
    CGContextDrawImage(cgContext, CGRectMake(0.0, 0.0, widthInPoints, heightInPoints), imageRef);

    // Retrieve the UIImage from the current context
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    // Cleanup
    free(buffer);
    CFRelease(providerRef);
    CFRelease(colorspaceRef);
    CGImageRelease(imageRef);

    // Write image to file
    NSData *imageData;
    NSString *extension;
    
    if ([format isEqualToString:@"png"]) {
      imageData = UIImagePNGRepresentation(image);
      extension = @".png";
    } else {
      float compress = 1.0;
      if (options[@"compress"] != nil) {
        compress = [(NSString *)options[@"compress"] floatValue];
      }
      imageData = UIImageJPEGRepresentation(image, compress);
      extension = @".jpeg";
    }
    
    NSString *filePath = [self generateSnapshotPathWithExtension:extension];
    [imageData writeToFile:filePath atomically:YES];

    // Restore surrounding framebuffer
    glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer);

    // Return result object which imitates Expo.Asset so it can be used again to fill the texture
    NSMutableDictionary *result = [[NSMutableDictionary alloc] init];
    NSString *fileUrl = [[NSURL fileURLWithPath:filePath] absoluteString];

    result[@"uri"] = fileUrl;
    result[@"localUri"] = fileUrl;
    result[@"width"] = @(width);
    result[@"height"] = @(height);

    resolve(result);
  }];
}

- (NSDictionary *)currentViewport
{
  GLint viewport[4];
  glGetIntegerv(GL_VIEWPORT, viewport);
  return @{ @"x": @(viewport[0]), @"y": @(viewport[1]), @"width": @(viewport[2]), @"height": @(viewport[3]) };
}

- (GLint)defaultFramebuffer
{
  if ([self.delegate respondsToSelector:@selector(glContextGetDefaultFramebuffer)]) {
    return [self.delegate glContextGetDefaultFramebuffer];
  }

  return 0;
}

- (NSString *)generateSnapshotPathWithExtension:(NSString *)extension
{
  NSString *directory = [_manager.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"GLView"];
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];
  [EXFileSystem ensureDirExistsWithPath:directory];

  return [directory stringByAppendingPathComponent:fileName];
}

@end
