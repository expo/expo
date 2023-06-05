// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoGL/EXGLContext.h>
#import <ExpoGL/EXGLObjectManager.h>

#import <ExpoModulesCore/EXUtilities.h>
#import <ExpoModulesCore/EXUIManager.h>
#import <ExpoModulesCore/EXJavaScriptContextProvider.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>

#define BLOCK_SAFE_RUN(block, ...) block ? block(__VA_ARGS__) : (void) nil

@interface EXGLContext ()

@property (nonatomic, strong) dispatch_queue_t glQueue;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) EXGLObjectManager *objectManager;
@property (nonatomic, assign) BOOL isContextReady;
@property (nonatomic, assign) BOOL wasPrepareCalled;
@property (nonatomic) BOOL appIsBackgrounded;

@end

@implementation EXGLContext

- (instancetype)initWithDelegate:(id<EXGLContextDelegate>)delegate
               andModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    self.delegate = delegate;

    _moduleRegistry = moduleRegistry;
    _objectManager = (EXGLObjectManager *)[_moduleRegistry getExportedModuleOfClass:[EXGLObjectManager class]];
    _glQueue = dispatch_queue_create("host.exp.gl", DISPATCH_QUEUE_SERIAL);
    _eaglCtx = [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES3] ?: [[EAGLContext alloc] initWithAPI:kEAGLRenderingAPIOpenGLES2];
    _isContextReady = NO;
    _wasPrepareCalled = NO;
    _appIsBackgrounded = NO;
  }
  return self;
}

- (BOOL)isInitialized
{
  return _isContextReady;
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

- (void)initialize
{
  self->_contextId = EXGLContextCreate();
  [self->_objectManager saveContext:self];

  // listen for foreground/background transitions
  [[NSNotificationCenter defaultCenter] addObserver:self
                                        selector:@selector(onApplicationDidBecomeActive:)
                                        name:UIApplicationDidBecomeActiveNotification
                                        object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                        selector:@selector(onApplicationWillResignActive:)
                                        name:UIApplicationWillResignActiveNotification
                                        object:nil];
}

- (void)onApplicationWillResignActive:(NSNotification *)notification
{
  _appIsBackgrounded = YES;
  dispatch_sync(_glQueue, ^{
    glFinish();
  });
}

- (void)onApplicationDidBecomeActive:(NSNotification *)notification {
  _appIsBackgrounded = NO;
  [self flush];
}

- (void)prepare:(void(^)(BOOL))callback andEnableExperimentalWorkletSupport:(BOOL)enableExperimentalWorkletSupport
{
  if (_wasPrepareCalled) {
    return;
  }
  _wasPrepareCalled = YES;
  id<EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)];
  id<EXJavaScriptContextProvider> jsContextProvider = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXJavaScriptContextProvider)];

  void *jsRuntimePtr = [jsContextProvider javaScriptRuntimePointer];

  if (jsRuntimePtr) {
    __weak __typeof__(self) weakSelf = self;
    __weak __typeof__(uiManager) weakUIManager = uiManager;

    [uiManager dispatchOnClientThread:^{
      EXGLContext *self = weakSelf;
      id<EXUIManager> uiManager = weakUIManager;

      if (!self || !uiManager) {
        BLOCK_SAFE_RUN(callback, NO);
        return;
      }

      EXGLContextSetDefaultFramebuffer(self->_contextId, [self defaultFramebuffer]);
      EXGLContextPrepare(jsRuntimePtr, self->_contextId, [self](){
        [self flush];
      });

      if (enableExperimentalWorkletSupport) {
        dispatch_sync(dispatch_get_main_queue(), ^{
          EXGLContextPrepareWorklet(self->_contextId);
        });
      }
      _isContextReady = YES;

      if ([self.delegate respondsToSelector:@selector(glContextInitialized:)]) {
        [self.delegate glContextInitialized:self];
      }

      BLOCK_SAFE_RUN(callback, YES);
    }];
  } else {
    BLOCK_SAFE_RUN(callback, NO);
    EXLogWarn(@"EXGL: Can only run on JavaScriptCore! Do you have 'Remote Debugging' enabled in your app's Developer Menu (https://reactnative.dev/docs/debugging)? EXGL is not supported while using Remote Debugging, you will need to disable it to use EXGL.");
  }
}

- (void)flush
{
  if (_appIsBackgrounded) {
      return;
  }
  [self runAsync:^{
    EXGLContextFlush(self->_contextId);

    if ([self.delegate respondsToSelector:@selector(glContextFlushed:)]) {
      [self.delegate glContextFlushed:self];
    }
  }];
}

- (void)destroy
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidBecomeActiveNotification object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillResignActiveNotification object:nil];

  [self runAsync:^{
    if ([self.delegate respondsToSelector:@selector(glContextWillDestroy:)]) {
      [self.delegate glContextWillDestroy:self];
    }

    // Flush all the stuff
    EXGLContextFlush(self->_contextId);

    id<EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)];
    [uiManager dispatchOnClientThread:^{
      // Destroy JS binding
      EXGLContextDestroy(self->_contextId);

      // Remove from dictionary of contexts
      [self->_objectManager deleteContextWithId:@(self->_contextId)];
    }];
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
                        resolve:(EXPromiseResolveBlock)resolve
                         reject:(EXPromiseRejectBlock)reject
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
      sourceFramebuffer = EXGLContextGetObject(self.contextId, exglFramebufferId);
    } else {
      // headless context doesn't have default framebuffer, so we use the current one
      sourceFramebuffer = [self defaultFramebuffer] || prevFramebuffer;
    }

    if (sourceFramebuffer == 0) {
      reject(
             @"E_GL_NO_FRAMEBUFFER",
             nil,
             EXErrorWithMessage(@"No framebuffer bound. Create and bind one to take a snapshot from it.")
             );
      return;
    }
    if (width <= 0 || height <= 0) {
      reject(
             @"E_GL_INVALID_VIEWPORT",
             nil,
             EXErrorWithMessage(@"Rect's width and height must be greater than 0. If you didn't set `rect` option, check if the viewport is set correctly.")
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
    CGFloat scale = [EXUtilities screenScale];
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

    if ([format isEqualToString:@"webp"]) {
      EXLogWarn(@"iOS doesn't support 'webp' representation, so 'takeSnapshot' won't work with that format. The image is going to be exported as 'png', but consider using a different code for iOS. Check this docs to learn how to do platform specific code (https://reactnative.dev/docs/platform-specific-code)");
      imageData = UIImagePNGRepresentation(image);
      extension = @".png";
    }
    else if ([format isEqualToString:@"png"]) {
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
  id<EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  NSString *directory = [fileSystem.cachesDirectory stringByAppendingPathComponent:@"GLView"];
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];

  [fileSystem ensureDirExistsWithPath:directory];

  return [directory stringByAppendingPathComponent:fileName];
}

@end
