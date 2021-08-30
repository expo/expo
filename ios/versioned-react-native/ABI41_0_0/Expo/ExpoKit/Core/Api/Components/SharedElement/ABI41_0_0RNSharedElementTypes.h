//
//  ABI41_0_0RNSharedElementTypes.h
//  ABI41_0_0React-native-shared-element
//

#ifndef ABI41_0_0RNSharedElementTypes_h
#define ABI41_0_0RNSharedElementTypes_h

typedef NS_ENUM(NSInteger, ABI41_0_0RNSharedElementContentType) {
    ABI41_0_0RNSharedElementContentTypeNone = 0,
    ABI41_0_0RNSharedElementContentTypeSnapshotView = 1,
    ABI41_0_0RNSharedElementContentTypeSnapshotImage = 2,
    ABI41_0_0RNSharedElementContentTypeRawImage = 3
};

typedef NS_ENUM(NSInteger, ABI41_0_0RNSharedElementAnimation) {
    ABI41_0_0RNSharedElementAnimationMove = 0,
    ABI41_0_0RNSharedElementAnimationFade = 1,
    ABI41_0_0RNSharedElementAnimationFadeIn = 2,
    ABI41_0_0RNSharedElementAnimationFadeOut = 3
};

typedef NS_ENUM(NSInteger, ABI41_0_0RNSharedElementResize) {
    ABI41_0_0RNSharedElementResizeAuto = 0,
    ABI41_0_0RNSharedElementResizeStretch = 1,
    ABI41_0_0RNSharedElementResizeClip = 2,
    ABI41_0_0RNSharedElementResizeNone = 3
};

typedef NS_ENUM(NSInteger, ABI41_0_0RNSharedElementAlign) {
    ABI41_0_0RNSharedElementAlignAuto = 0,
    ABI41_0_0RNSharedElementAlignLeftTop = 1,
    ABI41_0_0RNSharedElementAlignLeftCenter = 2,
    ABI41_0_0RNSharedElementAlignLeftBottom = 3,
    ABI41_0_0RNSharedElementAlignRightTop = 4,
    ABI41_0_0RNSharedElementAlignRightCenter = 5,
    ABI41_0_0RNSharedElementAlignRightBottom = 6,
    ABI41_0_0RNSharedElementAlignCenterTop = 7,
    ABI41_0_0RNSharedElementAlignCenterCenter = 8,
    ABI41_0_0RNSharedElementAlignCenterBottom = 9
};


#endif
