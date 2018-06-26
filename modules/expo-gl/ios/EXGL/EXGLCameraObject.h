// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCameraInterface/EXCameraInterface.h>

#import <EXGL/EXGLContext.h>
#import <EXGL/EXGLObject.h>

@interface EXGLCameraObject : EXGLObject

- (instancetype)initWithContext:(EXGLContext *)glContext andCamera:(id<EXCameraInterface>)camera;

@end
