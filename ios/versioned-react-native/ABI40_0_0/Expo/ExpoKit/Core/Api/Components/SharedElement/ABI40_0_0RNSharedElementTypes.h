//
//  ABI40_0_0RNSharedElementTypes.h
//  ABI40_0_0React-native-shared-element
//

#ifndef ABI40_0_0RNSharedElementTypes_h
#define ABI40_0_0RNSharedElementTypes_h

typedef NS_ENUM(NSInteger, ABI40_0_0RNSharedElementContentType) {
    ABI40_0_0RNSharedElementContentTypeNone = 0,
    ABI40_0_0RNSharedElementContentTypeSnapshotView = 1,
    ABI40_0_0RNSharedElementContentTypeSnapshotImage = 2,
    ABI40_0_0RNSharedElementContentTypeRawImage = 3
};

typedef NS_ENUM(NSInteger, ABI40_0_0RNSharedElementAnimation) {
    ABI40_0_0RNSharedElementAnimationMove = 0,
    ABI40_0_0RNSharedElementAnimationFade = 1,
    ABI40_0_0RNSharedElementAnimationFadeIn = 2,
    ABI40_0_0RNSharedElementAnimationFadeOut = 3
};

typedef NS_ENUM(NSInteger, ABI40_0_0RNSharedElementResize) {
    ABI40_0_0RNSharedElementResizeAuto = 0,
    ABI40_0_0RNSharedElementResizeStretch = 1,
    ABI40_0_0RNSharedElementResizeClip = 2,
    ABI40_0_0RNSharedElementResizeNone = 3
};

typedef NS_ENUM(NSInteger, ABI40_0_0RNSharedElementAlign) {
    ABI40_0_0RNSharedElementAlignAuto = 0,
    ABI40_0_0RNSharedElementAlignLeftTop = 1,
    ABI40_0_0RNSharedElementAlignLeftCenter = 2,
    ABI40_0_0RNSharedElementAlignLeftBottom = 3,
    ABI40_0_0RNSharedElementAlignRightTop = 4,
    ABI40_0_0RNSharedElementAlignRightCenter = 5,
    ABI40_0_0RNSharedElementAlignRightBottom = 6,
    ABI40_0_0RNSharedElementAlignCenterTop = 7,
    ABI40_0_0RNSharedElementAlignCenterCenter = 8,
    ABI40_0_0RNSharedElementAlignCenterBottom = 9
};


#endif
