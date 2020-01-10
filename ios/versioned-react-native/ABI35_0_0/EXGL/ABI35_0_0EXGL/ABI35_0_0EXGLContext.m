// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXGL/ABI35_0_0EXGLContext.h>
#import <ABI35_0_0EXGL/ABI35_0_0EXGLObjectManager.h>

#import <ABI35_0_0UMCore/ABI35_0_0UMUtilities.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMUIManager.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMJavaScriptContextProvider.h>
#import <ABI35_0_0UMFileSystemInterface/ABI35_0_0UMFileSystemInterface.h>

#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>

#define BLOCK_SAFE_RUN(block, ...) block ? block(__VA_ARGS__) : nil

@interface ABI35_0_0EXGLContext ()

@property (nonatomic, strong) dispatch_queue_t glQueue;
@property (nonatomic, weak) ABI35_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) ABI35_0_0EXGLObjectManager *objectManager;

@end

@implementation ABI35_0_0EXGLContext

- (instancetype)initWithDelegate:(id<ABI35_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    self.delegate = delegate;

    _moduleRegistry = moduleRegistry;
    _objectManager = (ABI35_0_0EXGLObjectManager *)[_moduleRegistry getExportedModuleOfClass:[ABI35_0_0EXGLObjectManager class]];
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
      [self runInEAGLContext:self->_eaglCtx callback:callback];
    });
  }
}

- (void)initialize:(void(^)(BOOL))callback
{
  id<ABI35_0_0UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI35_0_0UMUIManager)];
  id<ABI35_0_0UMJavaScriptContextProvider> jsContextProvider = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI35_0_0UMJavaScriptContextProvider)];
  
  long jsRuntimePtr = [jsContextProvider javaScriptRuntimePtr];
  
  if (jsRuntimePtr) {
    __weak __typeof__(self) weakSelf = self;
    __weak __typeof__(uiManager) weakUIManager = uiManager;
    
    [uiManager dispatchOnClientThread:^{
      ABI35_0_0EXGLContext *self = weakSelf;
      id<ABI35_0_0UMUIManager> uiManager = weakUIManager;
      
      if (!self || !uiManager) {
        BLOCK_SAFE_RUN(callback, NO);
        return;
      }
      
      self->_contextId = UEXGLContextCreate(jsRuntimePtr);
      [self->_objectManager saveContext:self];
      
      UEXGLContextSetFlushMethodObjc(self->_contextId, ^{
        [self flush];
      });
      
      if ([self.delegate respondsToSelector:@selector(glContextInitialized:)]) {
        [self.delegate glContextInitialized:self];
      }
      BLOCK_SAFE_RUN(callback, YES);
    }];
  } else {
    BLOCK_SAFE_RUN(callback, NO);
    ABI35_0_0UMLogWarn(@"ABI35_0_0EXGL: Can only run on JavaScriptCore! Do you have 'Remote Debugging' enabled in your app's Developer Menu (https://facebook.github.io/ReactABI35_0_0-native/docs/debugging.html)? ABI35_0_0EXGL is not supported while using Remote Debugging, you will need to disable it to use ABI35_0_0EXGL.");
  }
}

- (void)flush
{
  [self runAsync:^{
    UEXGLContextFlush(self->_contextId);

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
    UEXGLContextFlush(self->_contextId);

    // Destroy JS binding
    UEXGLContextDestroy(self->_contextId);

    // Remove from dictionary of contexts
    [self->_objectManager deleteContextWithId:@(self->_contextId)];
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
                        resolve:(ABI35_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI35_0_0UMPromiseRejectBlock)reject
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
             ABI35_0_0UMErrorWithMessage(@"No framebuffer bound. Create and bind one to take a snapshot from it.")
             );
      return;
    }
    if (width <= 0 || height <= 0) {
      reject(
             @"E_GL_INVALID_VIEWPORT",
             nil,
             ABI35_0_0UMErrorWithMessage(@"Rect's width and height must be greater than 0. If you didn't set `rect` option, check if the viewport is set correctly.")
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
    CGFloat scale = [ABI35_0_0UMUtilities screenScale];
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
  id<ABI35_0_0UMFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI35_0_0UMFileSystemInterface)];
  NSString *directory = [fileSystem.cachesDirectory stringByAppendingPathComponent:@"GLView"];
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];
  
  [fileSystem ensureDirExistsWithPath:directory];

  return [directory stringByAppendingPathComponent:fileName];
}

@end
