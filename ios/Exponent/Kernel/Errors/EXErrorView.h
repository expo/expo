// Copyright 2015-present 650 Industries. All rights reserved.
//
//  This native view is presented only when the Kernel RN bridge is inoperable.
//  Typically this is either because the kernel JS couldn't load, or because the kernel JS encountered a fatal error.
//

#import <UIKit/UIKit.h>

@class EXErrorView;

typedef enum EXFatalErrorType {
  kEXFatalErrorTypeLoading,
  kEXFatalErrorTypeException,
} EXFatalErrorType;

@protocol EXErrorViewDelegate <NSObject>

- (void)errorViewDidSelectRetry: (EXErrorView *)errorView;

@end

@interface EXErrorView : UIView

@property (nonatomic, assign) EXFatalErrorType type;
@property (nonatomic, assign) id<EXErrorViewDelegate> delegate;
@property (nonatomic, strong) NSError *error;

@end
