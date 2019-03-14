// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCameraInterface/UMCameraInterface.h>

#import <EXGL/EXGLContext.h>
#import <EXGL/EXGLObject.h>

@interface EXGLCameraObject : EXGLObject

- (instancetype)initWithContext:(EXGLContext *)glContext andCamera:(id<UMCameraInterface>)camera;

@end
