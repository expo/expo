//
//  RNSharedElementTypes.h
//  react-native-shared-element
//

#ifndef RNSharedElementTypes_h
#define RNSharedElementTypes_h

typedef NS_ENUM(NSInteger, RNSharedElementContentType) {
    RNSharedElementContentTypeNone = 0,
    RNSharedElementContentTypeSnapshotView = 1,
    RNSharedElementContentTypeSnapshotImage = 2,
    RNSharedElementContentTypeRawImage = 3
};

typedef NS_ENUM(NSInteger, RNSharedElementAnimation) {
    RNSharedElementAnimationMove = 0,
    RNSharedElementAnimationFade = 1,
    RNSharedElementAnimationFadeIn = 2,
    RNSharedElementAnimationFadeOut = 3
};

typedef NS_ENUM(NSInteger, RNSharedElementResize) {
    RNSharedElementResizeAuto = 0,
    RNSharedElementResizeStretch = 1,
    RNSharedElementResizeClip = 2,
    RNSharedElementResizeNone = 3
};

typedef NS_ENUM(NSInteger, RNSharedElementAlign) {
    RNSharedElementAlignAuto = 0,
    RNSharedElementAlignLeftTop = 1,
    RNSharedElementAlignLeftCenter = 2,
    RNSharedElementAlignLeftBottom = 3,
    RNSharedElementAlignRightTop = 4,
    RNSharedElementAlignRightCenter = 5,
    RNSharedElementAlignRightBottom = 6,
    RNSharedElementAlignCenterTop = 7,
    RNSharedElementAlignCenterCenter = 8,
    RNSharedElementAlignCenterBottom = 9
};


#endif
