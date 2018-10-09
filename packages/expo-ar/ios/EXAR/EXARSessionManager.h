// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXGL/EXGLView.h>
#import <ARKit/ARKit.h>
#import <EXAR/EXARSessionManagerDelegate.h>

API_AVAILABLE(ios(11.0))
@interface EXARSessionManager : NSObject

@property (nonatomic, weak) id<EXARSessionManagerDelegate> delegate;
@property (nonatomic, assign) ARPlaneDetection planeDetection;
@property (nonatomic, assign) ARWorldAlignment worldAlignment;

@property (nonatomic, assign) BOOL shouldAttemptRelocalization;
@property (nonatomic, assign) BOOL providesAudioData;
@property (nonatomic, assign) BOOL lightEstimationEnabled;
@property (nonatomic, assign) BOOL autoFocusEnabled;
@property (nonatomic, assign) NSArray* detectionImages;
@property (nonatomic, assign) ARVideoFormat *videoFormat;
@property (nonatomic, assign) matrix_float4x4 worldOrigin;
@property (nonatomic, readonly) int cameraTexture;

- (NSDictionary *)startWithGLView:(EXGLView *)glView trackingConfiguration:(NSString *) trackingConfiguration;
- (NSDictionary *)arMatricesWithZNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (nullable NSError *)startConfiguration:(NSString *)configuration;
- (nonnull NSDictionary *)getCurrentFrameWithAttributes:(NSDictionary *)attributes;
- (NSDictionary *)performHitTest:(CGPoint)point types:(ARHitTestResultType)types;

- (void)pause;
- (void)resume;
- (void)reset;
- (void)stop;

@end
