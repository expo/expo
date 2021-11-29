/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.graphics.Matrix;
import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.MatrixMathHelper;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.TransformHelper;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

import java.util.Locale;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import static com.facebook.react.uimanager.MatrixMathHelper.determinant;
import static com.facebook.react.uimanager.MatrixMathHelper.inverse;
import static com.facebook.react.uimanager.MatrixMathHelper.multiplyVectorByMatrix;
import static com.facebook.react.uimanager.MatrixMathHelper.roundTo3Places;
import static com.facebook.react.uimanager.MatrixMathHelper.transpose;
import static com.facebook.react.uimanager.MatrixMathHelper.v3Combine;
import static com.facebook.react.uimanager.MatrixMathHelper.v3Cross;
import static com.facebook.react.uimanager.MatrixMathHelper.v3Dot;
import static com.facebook.react.uimanager.MatrixMathHelper.v3Length;
import static com.facebook.react.uimanager.MatrixMathHelper.v3Normalize;
import static com.facebook.react.uimanager.ViewProps.ALIGN_CONTENT;
import static com.facebook.react.uimanager.ViewProps.ALIGN_ITEMS;
import static com.facebook.react.uimanager.ViewProps.ALIGN_SELF;
import static com.facebook.react.uimanager.ViewProps.BORDER_BOTTOM_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BORDER_END_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BORDER_LEFT_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BORDER_RIGHT_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BORDER_START_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BORDER_TOP_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BORDER_WIDTH;
import static com.facebook.react.uimanager.ViewProps.BOTTOM;
import static com.facebook.react.uimanager.ViewProps.COLLAPSABLE;
import static com.facebook.react.uimanager.ViewProps.DISPLAY;
import static com.facebook.react.uimanager.ViewProps.END;
import static com.facebook.react.uimanager.ViewProps.FLEX;
import static com.facebook.react.uimanager.ViewProps.FLEX_BASIS;
import static com.facebook.react.uimanager.ViewProps.FLEX_DIRECTION;
import static com.facebook.react.uimanager.ViewProps.FLEX_GROW;
import static com.facebook.react.uimanager.ViewProps.FLEX_SHRINK;
import static com.facebook.react.uimanager.ViewProps.FLEX_WRAP;
import static com.facebook.react.uimanager.ViewProps.HEIGHT;
import static com.facebook.react.uimanager.ViewProps.JUSTIFY_CONTENT;
import static com.facebook.react.uimanager.ViewProps.LEFT;
import static com.facebook.react.uimanager.ViewProps.MARGIN;
import static com.facebook.react.uimanager.ViewProps.MARGIN_BOTTOM;
import static com.facebook.react.uimanager.ViewProps.MARGIN_END;
import static com.facebook.react.uimanager.ViewProps.MARGIN_HORIZONTAL;
import static com.facebook.react.uimanager.ViewProps.MARGIN_LEFT;
import static com.facebook.react.uimanager.ViewProps.MARGIN_RIGHT;
import static com.facebook.react.uimanager.ViewProps.MARGIN_START;
import static com.facebook.react.uimanager.ViewProps.MARGIN_TOP;
import static com.facebook.react.uimanager.ViewProps.MARGIN_VERTICAL;
import static com.facebook.react.uimanager.ViewProps.MAX_HEIGHT;
import static com.facebook.react.uimanager.ViewProps.MAX_WIDTH;
import static com.facebook.react.uimanager.ViewProps.MIN_HEIGHT;
import static com.facebook.react.uimanager.ViewProps.MIN_WIDTH;
import static com.facebook.react.uimanager.ViewProps.OVERFLOW;
import static com.facebook.react.uimanager.ViewProps.PADDING;
import static com.facebook.react.uimanager.ViewProps.PADDING_BOTTOM;
import static com.facebook.react.uimanager.ViewProps.PADDING_END;
import static com.facebook.react.uimanager.ViewProps.PADDING_HORIZONTAL;
import static com.facebook.react.uimanager.ViewProps.PADDING_LEFT;
import static com.facebook.react.uimanager.ViewProps.PADDING_RIGHT;
import static com.facebook.react.uimanager.ViewProps.PADDING_START;
import static com.facebook.react.uimanager.ViewProps.PADDING_TOP;
import static com.facebook.react.uimanager.ViewProps.PADDING_VERTICAL;
import static com.facebook.react.uimanager.ViewProps.POSITION;
import static com.facebook.react.uimanager.ViewProps.RIGHT;
import static com.facebook.react.uimanager.ViewProps.START;
import static com.facebook.react.uimanager.ViewProps.TOP;
import static com.facebook.react.uimanager.ViewProps.WIDTH;
import static com.horcrux.svg.RenderableView.CAP_ROUND;
import static com.horcrux.svg.RenderableView.FILL_RULE_NONZERO;
import static com.horcrux.svg.RenderableView.JOIN_ROUND;

/**
 * ViewManager for all RNSVG views
 */
class RenderableViewManager extends ViewGroupManager<VirtualView> {

    private enum SVGClass {
        RNSVGGroup,
        RNSVGPath,
        RNSVGText,
        RNSVGTSpan,
        RNSVGTextPath,
        RNSVGImage,
        RNSVGCircle,
        RNSVGEllipse,
        RNSVGLine,
        RNSVGRect,
        RNSVGClipPath,
        RNSVGDefs,
        RNSVGUse,
        RNSVGSymbol,
        RNSVGLinearGradient,
        RNSVGRadialGradient,
        RNSVGPattern,
        RNSVGMask,
        RNSVGMarker,
        RNSVGForeignObject,
    }

    class RenderableShadowNode extends LayoutShadowNode {

        @SuppressWarnings({"unused", "EmptyMethod"})
        @ReactPropGroup(
            names = {
                ALIGN_SELF,
                ALIGN_ITEMS,
                COLLAPSABLE,
                FLEX,
                FLEX_BASIS,
                FLEX_DIRECTION,
                FLEX_GROW,
                FLEX_SHRINK,
                FLEX_WRAP,
                JUSTIFY_CONTENT,
                OVERFLOW,
                ALIGN_CONTENT,
                DISPLAY,

                /* position */
                POSITION,
                RIGHT,
                TOP,
                BOTTOM,
                LEFT,
                START,
                END,

                /* dimensions */
                WIDTH,
                HEIGHT,
                MIN_WIDTH,
                MAX_WIDTH,
                MIN_HEIGHT,
                MAX_HEIGHT,

                /* margins */
                MARGIN,
                MARGIN_VERTICAL,
                MARGIN_HORIZONTAL,
                MARGIN_LEFT,
                MARGIN_RIGHT,
                MARGIN_TOP,
                MARGIN_BOTTOM,
                MARGIN_START,
                MARGIN_END,

                /* paddings */
                PADDING,
                PADDING_VERTICAL,
                PADDING_HORIZONTAL,
                PADDING_LEFT,
                PADDING_RIGHT,
                PADDING_TOP,
                PADDING_BOTTOM,
                PADDING_START,
                PADDING_END,

                BORDER_WIDTH,
                BORDER_START_WIDTH,
                BORDER_END_WIDTH,
                BORDER_TOP_WIDTH,
                BORDER_BOTTOM_WIDTH,
                BORDER_LEFT_WIDTH,
                BORDER_RIGHT_WIDTH,
            }
        )
        public void ignoreLayoutProps(int index, Dynamic value) {}
    }

    @Override
    public LayoutShadowNode createShadowNodeInstance() {
        return new RenderableShadowNode();
    }

    @Override
    public Class<RenderableShadowNode> getShadowNodeClass() {
        return RenderableShadowNode.class;
    }


    private final SVGClass svgClass;
    private final String mClassName;

    static class MatrixDecompositionContext extends MatrixMathHelper.MatrixDecompositionContext {
        final double[] perspective = new double[4];
        final double[] scale = new double[3];
        final double[] skew = new double[3];
        final double[] translation = new double[3];
        final double[] rotationDegrees = new double[3];
    }

    private static final MatrixDecompositionContext sMatrixDecompositionContext =
            new MatrixDecompositionContext();
    private static final double[] sTransformDecompositionArray = new double[16];

    private static final int PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX = 2;
    private static final float CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER = 5;

    private static final double EPSILON = .00001d;

    private static boolean isZero(double d) {
        return !Double.isNaN(d) && Math.abs(d) < EPSILON;
    }

    private static void decomposeMatrix() {

        // output values
        final double[] perspective = sMatrixDecompositionContext.perspective;
        final double[] scale = sMatrixDecompositionContext.scale;
        final double[] skew = sMatrixDecompositionContext.skew;
        final double[] translation = sMatrixDecompositionContext.translation;
        final double[] rotationDegrees = sMatrixDecompositionContext.rotationDegrees;

        // create normalized, 2d array matrix
        // and normalized 1d array perspectiveMatrix with redefined 4th column
        if (isZero(sTransformDecompositionArray[15])) {
            return;
        }
        double[][] matrix = new double[4][4];
        double[] perspectiveMatrix = new double[16];
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                double value = sTransformDecompositionArray[(i * 4) + j] / sTransformDecompositionArray[15];
                matrix[i][j] = value;
                perspectiveMatrix[(i * 4) + j] = j == 3 ? 0 : value;
            }
        }
        perspectiveMatrix[15] = 1;

        // test for singularity of upper 3x3 part of the perspective matrix
        if (isZero(determinant(perspectiveMatrix))) {
            return;
        }

        // isolate perspective
        if (!isZero(matrix[0][3]) || !isZero(matrix[1][3]) || !isZero(matrix[2][3])) {
            // rightHandSide is the right hand side of the equation.
            // rightHandSide is a vector, or point in 3d space relative to the origin.
            double[] rightHandSide = { matrix[0][3], matrix[1][3], matrix[2][3], matrix[3][3] };

            // Solve the equation by inverting perspectiveMatrix and multiplying
            // rightHandSide by the inverse.
            double[] inversePerspectiveMatrix = inverse(
                    perspectiveMatrix
            );
            double[] transposedInversePerspectiveMatrix = transpose(
                    inversePerspectiveMatrix
            );
            multiplyVectorByMatrix(rightHandSide, transposedInversePerspectiveMatrix, perspective);
        } else {
            // no perspective
            perspective[0] = perspective[1] = perspective[2] = 0d;
            perspective[3] = 1d;
        }

        // translation is simple
        System.arraycopy(matrix[3], 0, translation, 0, 3);

        // Now get scale and shear.
        // 'row' is a 3 element array of 3 component vectors
        double[][] row = new double[3][3];
        for (int i = 0; i < 3; i++) {
            row[i][0] = matrix[i][0];
            row[i][1] = matrix[i][1];
            row[i][2] = matrix[i][2];
        }

        // Compute X scale factor and normalize first row.
        scale[0] = v3Length(row[0]);
        row[0] = v3Normalize(row[0], scale[0]);

        // Compute XY shear factor and make 2nd row orthogonal to 1st.
        skew[0] = v3Dot(row[0], row[1]);
        row[1] = v3Combine(row[1], row[0], 1.0, -skew[0]);

        // Compute XY shear factor and make 2nd row orthogonal to 1st.
        skew[0] = v3Dot(row[0], row[1]);
        row[1] = v3Combine(row[1], row[0], 1.0, -skew[0]);

        // Now, compute Y scale and normalize 2nd row.
        scale[1] = v3Length(row[1]);
        row[1] = v3Normalize(row[1], scale[1]);
        skew[0] /= scale[1];

        // Compute XZ and YZ shears, orthogonalize 3rd row
        skew[1] = v3Dot(row[0], row[2]);
        row[2] = v3Combine(row[2], row[0], 1.0, -skew[1]);
        skew[2] = v3Dot(row[1], row[2]);
        row[2] = v3Combine(row[2], row[1], 1.0, -skew[2]);

        // Next, get Z scale and normalize 3rd row.
        scale[2] = v3Length(row[2]);
        row[2] = v3Normalize(row[2], scale[2]);
        skew[1] /= scale[2];
        skew[2] /= scale[2];

        // At this point, the matrix (in rows) is orthonormal.
        // Check for a coordinate system flip.  If the determinant
        // is -1, then negate the matrix and the scaling factors.
        double[] pdum3 = v3Cross(row[1], row[2]);
        if (v3Dot(row[0], pdum3) < 0) {
            for (int i = 0; i < 3; i++) {
                scale[i] *= -1;
                row[i][0] *= -1;
                row[i][1] *= -1;
                row[i][2] *= -1;
            }
        }

        // Now, get the rotations out
        // Based on: http://nghiaho.com/?page_id=846
        double conv = 180 / Math.PI;
        rotationDegrees[0] = roundTo3Places(-Math.atan2(row[2][1], row[2][2]) * conv);
        rotationDegrees[1] = roundTo3Places(-Math.atan2(-row[2][0], Math.sqrt(row[2][1] * row[2][1] + row[2][2] * row[2][2])) * conv);
        rotationDegrees[2] = roundTo3Places(-Math.atan2(row[1][0], row[0][0]) * conv);
    }

    private static void setTransformProperty(View view, ReadableArray transforms) {
        TransformHelper.processTransform(transforms, sTransformDecompositionArray);
        decomposeMatrix();
        view.setTranslationX(
                PixelUtil.toPixelFromDIP((float) sMatrixDecompositionContext.translation[0]));
        view.setTranslationY(
                PixelUtil.toPixelFromDIP((float) sMatrixDecompositionContext.translation[1]));
        view.setRotation((float) sMatrixDecompositionContext.rotationDegrees[2]);
        view.setRotationX((float) sMatrixDecompositionContext.rotationDegrees[0]);
        view.setRotationY((float) sMatrixDecompositionContext.rotationDegrees[1]);
        view.setScaleX((float) sMatrixDecompositionContext.scale[0]);
        view.setScaleY((float) sMatrixDecompositionContext.scale[1]);

        double[] perspectiveArray = sMatrixDecompositionContext.perspective;

        if (perspectiveArray.length > PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX) {
            float invertedCameraDistance = (float) perspectiveArray[PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX];
            if (invertedCameraDistance == 0) {
                // Default camera distance, before scale multiplier (1280)
                invertedCameraDistance = 0.00078125f;
            }
            float cameraDistance = -1 / invertedCameraDistance;
            float scale = DisplayMetricsHolder.getScreenDisplayMetrics().density;

            // The following converts the matrix's perspective to a camera distance
            // such that the camera perspective looks the same on Android and iOS.
            // The native Android implementation removed the screen density from the
            // calculation, so squaring and a normalization value of
            // sqrt(5) produces an exact replica with iOS.
            // For more information, see https://github.com/facebook/react-native/pull/18302
            float normalizedCameraDistance = scale * scale * cameraDistance * CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER;
            view.setCameraDistance(normalizedCameraDistance);

        }
    }

    private static void resetTransformProperty(View view) {
        view.setTranslationX(0);
        view.setTranslationY(0);
        view.setRotation(0);
        view.setRotationX(0);
        view.setRotationY(0);
        view.setScaleX(1);
        view.setScaleY(1);
        view.setCameraDistance(0);
    }

    static class GroupViewManager extends RenderableViewManager {
        GroupViewManager() {
            super(SVGClass.RNSVGGroup);
        }

        GroupViewManager(SVGClass svgClass) {
            super(svgClass);
        }

        @ReactProp(name = "font")
        public void setFont(GroupView node, @Nullable ReadableMap font) {
            node.setFont(font);
        }

        @ReactProp(name = "fontSize")
        public void setFontSize(GroupView node, Dynamic fontSize) {
            JavaOnlyMap map = new JavaOnlyMap();
            switch (fontSize.getType()) {
                case Number:
                    map.putDouble("fontSize", fontSize.asDouble());
                    break;
                case String:
                    map.putString("fontSize", fontSize.asString());
                    break;
                default:
                    return;
            }
            node.setFont(map);
        }

        @ReactProp(name = "fontWeight")
        public void setFontWeight(GroupView node, Dynamic fontWeight) {
            JavaOnlyMap map = new JavaOnlyMap();
            switch (fontWeight.getType()) {
                case Number:
                    map.putDouble("fontWeight", fontWeight.asDouble());
                    break;
                case String:
                    map.putString("fontWeight", fontWeight.asString());
                    break;
                default:
                    return;
            }
            node.setFont(map);
        }
    }


    static class PathViewManager extends RenderableViewManager {
        PathViewManager() {
            super(SVGClass.RNSVGPath);
        }

        @ReactProp(name = "d")
        public void setD(PathView node, String d) {
            node.setD(d);
        }
    }

    static class TextViewManager extends GroupViewManager {
        TextViewManager() {
            super(SVGClass.RNSVGText);
        }

        TextViewManager(SVGClass svgClass) {
            super(svgClass);
        }

        @ReactProp(name = "inlineSize")
        public void setInlineSize(TextView node, Dynamic inlineSize) {
            node.setInlineSize(inlineSize);
        }

        @ReactProp(name = "textLength")
        public void setTextLength(TextView node, Dynamic length) {
            node.setTextLength(length);
        }

        @ReactProp(name = "lengthAdjust")
        public void setLengthAdjust(TextView node, @Nullable String adjustment) {
            node.setLengthAdjust(adjustment);
        }

        @ReactProp(name = "alignmentBaseline")
        public void setMethod(TextView node, @Nullable String alignment) {
            node.setMethod(alignment);
        }

        @ReactProp(name = "baselineShift")
        public void setBaselineShift(TextView node, Dynamic baselineShift) {
            node.setBaselineShift(baselineShift);
        }

        @ReactProp(name = "verticalAlign")
        public void setVerticalAlign(TextView node, @Nullable String verticalAlign) {
            node.setVerticalAlign(verticalAlign);
        }

        @ReactProp(name = "rotate")
        public void setRotate(TextView node, Dynamic rotate) {
            node.setRotate(rotate);
        }

        @ReactProp(name = "dx")
        public void setDeltaX(TextView node, Dynamic deltaX) {
            node.setDeltaX(deltaX);
        }

        @ReactProp(name = "dy")
        public void setDeltaY(TextView node, Dynamic deltaY) {
            node.setDeltaY(deltaY);
        }

        @ReactProp(name = "x")
        public void setX(TextView node, Dynamic positionX) {
            node.setPositionX(positionX);
        }

        @ReactProp(name = "y")
        public void setY(TextView node, Dynamic positionY) {
            node.setPositionY(positionY);
        }

        @ReactProp(name = "font")
        public void setFont(TextView node, @Nullable ReadableMap font) {
            node.setFont(font);
        }
    }

    static class TSpanViewManager extends TextViewManager {
        TSpanViewManager() {
            super(SVGClass.RNSVGTSpan);
        }

        @ReactProp(name = "content")
        public void setContent(TSpanView node, @Nullable String content) {
            node.setContent(content);
        }
    }

    static class TextPathViewManager extends TextViewManager {
        TextPathViewManager() {
            super(SVGClass.RNSVGTextPath);
        }

        @ReactProp(name = "href")
        public void setHref(TextPathView node, String href) {
            node.setHref(href);
        }

        @ReactProp(name = "startOffset")
        public void setStartOffset(TextPathView node, Dynamic startOffset) {
            node.setStartOffset(startOffset);
        }

        @ReactProp(name = "method")
        public void setMethod(TextPathView node, @Nullable String method) {
            node.setMethod(method);
        }

        @ReactProp(name = "spacing")
        public void setSpacing(TextPathView node, @Nullable String spacing) {
            node.setSpacing(spacing);
        }

        @ReactProp(name = "side")
        public void setSide(TextPathView node, @Nullable String side) {
            node.setSide(side);
        }

        @ReactProp(name = "midLine")
        public void setSharp(TextPathView node, @Nullable String midLine) {
            node.setSharp(midLine);
        }
    }

    static class ImageViewManager extends RenderableViewManager {
        ImageViewManager(){
            super(SVGClass.RNSVGImage);
        }

        @ReactProp(name = "x")
        public void setX(ImageView node, Dynamic x) {
            node.setX(x);
        }

        @ReactProp(name = "y")
        public void setY(ImageView node, Dynamic y) {
            node.setY(y);
        }

        @ReactProp(name = "width")
        public void setWidth(ImageView node, Dynamic width) {
            node.setWidth(width);
        }

        @ReactProp(name = "height")
        public void setHeight(ImageView node, Dynamic height) {
            node.setHeight(height);
        }

        @ReactProp(name = "src")
        public void setSrc(ImageView node, @Nullable ReadableMap src) {
            node.setSrc(src);
        }


        @ReactProp(name = "align")
        public void setAlign(ImageView node, String align) {
            node.setAlign(align);
        }

        @ReactProp(name = "meetOrSlice")
        public void setMeetOrSlice(ImageView node, int meetOrSlice) {
            node.setMeetOrSlice(meetOrSlice);
        }
    }

    static class CircleViewManager extends RenderableViewManager {
        CircleViewManager() {
            super(SVGClass.RNSVGCircle);
        }

        @ReactProp(name = "cx")
        public void setCx(CircleView node, Dynamic cx) {
            node.setCx(cx);
        }

        @ReactProp(name = "cy")
        public void setCy(CircleView node, Dynamic cy) {
            node.setCy(cy);
        }

        @ReactProp(name = "r")
        public void setR(CircleView node, Dynamic r) {
            node.setR(r);
        }
    }

    static class EllipseViewManager extends RenderableViewManager {
        EllipseViewManager() {
            super(SVGClass.RNSVGEllipse);
        }

        @ReactProp(name = "cx")
        public void setCx(EllipseView node, Dynamic cx) {
            node.setCx(cx);
        }

        @ReactProp(name = "cy")
        public void setCy(EllipseView node, Dynamic cy) {
            node.setCy(cy);
        }

        @ReactProp(name = "rx")
        public void setRx(EllipseView node, Dynamic rx) {
            node.setRx(rx);
        }

        @ReactProp(name = "ry")
        public void setRy(EllipseView node, Dynamic ry) {
            node.setRy(ry);
        }
    }

    static class LineViewManager extends RenderableViewManager {
        LineViewManager() {
            super(SVGClass.RNSVGLine);
        }

        @ReactProp(name = "x1")
        public void setX1(LineView node, Dynamic x1) {
            node.setX1(x1);
        }

        @ReactProp(name = "y1")
        public void setY1(LineView node, Dynamic y1) {
            node.setY1(y1);
        }

        @ReactProp(name = "x2")
        public void setX2(LineView node, Dynamic x2) {
            node.setX2(x2);
        }

        @ReactProp(name = "y2")
        public void setY2(LineView node, Dynamic y2) {
            node.setY2(y2);
        }
    }

    static class RectViewManager extends RenderableViewManager {
        RectViewManager() {
            super(SVGClass.RNSVGRect);
        }

        @ReactProp(name = "x")
        public void setX(RectView node, Dynamic x) {
            node.setX(x);
        }

        @ReactProp(name = "y")
        public void setY(RectView node, Dynamic y) {
            node.setY(y);
        }

        @ReactProp(name = "width")
        public void setWidth(RectView node, Dynamic width) {
            node.setWidth(width);
        }

        @ReactProp(name = "height")
        public void setHeight(RectView node, Dynamic height) {
            node.setHeight(height);
        }

        @ReactProp(name = "rx")
        public void setRx(RectView node, Dynamic rx) {
            node.setRx(rx);
        }

        @ReactProp(name = "ry")
        public void setRy(RectView node, Dynamic ry) {
            node.setRy(ry);
        }
    }

    static class ClipPathViewManager extends GroupViewManager {
        ClipPathViewManager() {
            super(SVGClass.RNSVGClipPath);
        }
    }

    static class DefsViewManager extends RenderableViewManager {
        DefsViewManager() {
            super(SVGClass.RNSVGDefs);
        }
    }

    static class UseViewManager extends RenderableViewManager {
        UseViewManager() {
            super(SVGClass.RNSVGUse);
        }

        @ReactProp(name = "href")
        public void setHref(UseView node, String href) {
            node.setHref(href);
        }

        @ReactProp(name = "x")
        public void setX(UseView node, Dynamic x) {
            node.setX(x);
        }

        @ReactProp(name = "y")
        public void setY(UseView node, Dynamic y) {
            node.setY(y);
        }

        @ReactProp(name = "width")
        public void setWidth(UseView node, Dynamic width) {
            node.setWidth(width);
        }

        @ReactProp(name = "height")
        public void setHeight(UseView node, Dynamic height) {
            node.setHeight(height);
        }
    }

    static class SymbolManager extends GroupViewManager {
        SymbolManager() {
            super(SVGClass.RNSVGSymbol);
        }

        @ReactProp(name = "minX")
        public void setMinX(SymbolView node, float minX) {
            node.setMinX(minX);
        }

        @ReactProp(name = "minY")
        public void setMinY(SymbolView node, float minY) {
            node.setMinY(minY);
        }

        @ReactProp(name = "vbWidth")
        public void setVbWidth(SymbolView node, float vbWidth) {
            node.setVbWidth(vbWidth);
        }

        @ReactProp(name = "vbHeight")
        public void setVbHeight(SymbolView node, float vbHeight) {
            node.setVbHeight(vbHeight);
        }

        @ReactProp(name = "align")
        public void setAlign(SymbolView node, String align) {
            node.setAlign(align);
        }

        @ReactProp(name = "meetOrSlice")
        public void setMeetOrSlice(SymbolView node, int meetOrSlice) {
            node.setMeetOrSlice(meetOrSlice);
        }
    }

    static class PatternManager extends GroupViewManager {
        PatternManager() {
            super(SVGClass.RNSVGPattern);
        }

        @ReactProp(name = "x")
        public void setX(PatternView node, Dynamic x) {
            node.setX(x);
        }

        @ReactProp(name = "y")
        public void setY(PatternView node, Dynamic y) {
            node.setY(y);
        }

        @ReactProp(name = "width")
        public void setWidth(PatternView node, Dynamic width) {
            node.setWidth(width);
        }

        @ReactProp(name = "height")
        public void setHeight(PatternView node, Dynamic height) {
            node.setHeight(height);
        }

        @ReactProp(name = "patternUnits")
        public void setPatternUnits(PatternView node, int patternUnits) {
            node.setPatternUnits(patternUnits);
        }

        @ReactProp(name = "patternContentUnits")
        public void setPatternContentUnits(PatternView node, int patternContentUnits) {
            node.setPatternContentUnits(patternContentUnits);
        }

        @ReactProp(name = "patternTransform")
        public void setPatternTransform(PatternView node, @Nullable ReadableArray matrixArray) {
            node.setPatternTransform(matrixArray);
        }

        @ReactProp(name = "minX")
        public void setMinX(PatternView node, float minX) {
            node.setMinX(minX);
        }

        @ReactProp(name = "minY")
        public void setMinY(PatternView node, float minY) {
            node.setMinY(minY);
        }

        @ReactProp(name = "vbWidth")
        public void setVbWidth(PatternView node, float vbWidth) {
            node.setVbWidth(vbWidth);
        }

        @ReactProp(name = "vbHeight")
        public void setVbHeight(PatternView node, float vbHeight) {
            node.setVbHeight(vbHeight);
        }

        @ReactProp(name = "align")
        public void setAlign(PatternView node, String align) {
            node.setAlign(align);
        }

        @ReactProp(name = "meetOrSlice")
        public void setMeetOrSlice(PatternView node, int meetOrSlice) {
            node.setMeetOrSlice(meetOrSlice);
        }
    }

    static class MaskManager extends GroupViewManager {
        MaskManager() {
            super(SVGClass.RNSVGMask);
        }

        @ReactProp(name = "x")
        public void setX(MaskView node, Dynamic x) {
            node.setX(x);
        }

        @ReactProp(name = "y")
        public void setY(MaskView node, Dynamic y) {
            node.setY(y);
        }

        @ReactProp(name = "width")
        public void setWidth(MaskView node, Dynamic width) {
            node.setWidth(width);
        }

        @ReactProp(name = "height")
        public void setHeight(MaskView node, Dynamic height) {
            node.setHeight(height);
        }

        @ReactProp(name = "maskUnits")
        public void setMaskUnits(MaskView node, int maskUnits) {
            node.setMaskUnits(maskUnits);
        }

        @ReactProp(name = "maskContentUnits")
        public void setMaskContentUnits(MaskView node, int maskContentUnits) {
            node.setMaskContentUnits(maskContentUnits);
        }

        @ReactProp(name = "maskTransform")
        public void setMaskTransform(MaskView node, @Nullable ReadableArray matrixArray) {
            node.setMaskTransform(matrixArray);
        }
    }

    static class ForeignObjectManager extends GroupViewManager {
        ForeignObjectManager() {
            super(SVGClass.RNSVGForeignObject);
        }

        @ReactProp(name = "x")
        public void setX(ForeignObjectView node, Dynamic x) {
            node.setX(x);
        }

        @ReactProp(name = "y")
        public void setY(ForeignObjectView node, Dynamic y) {
            node.setY(y);
        }

        @ReactProp(name = "width")
        public void setWidth(ForeignObjectView node, Dynamic width) {
            node.setWidth(width);
        }

        @ReactProp(name = "height")
        public void setHeight(ForeignObjectView node, Dynamic height) {
            node.setHeight(height);
        }
    }

    static class MarkerManager extends GroupViewManager {
        MarkerManager() {
            super(SVGClass.RNSVGMarker);
        }

        @ReactProp(name = "refX")
        public void setRefX(MarkerView node, Dynamic refX) {
            node.setRefX(refX);
        }

        @ReactProp(name = "refY")
        public void setRefY(MarkerView node, Dynamic refY) {
            node.setRefY(refY);
        }

        @ReactProp(name = "markerWidth")
        public void setMarkerWidth(MarkerView node, Dynamic markerWidth) {
            node.setMarkerWidth(markerWidth);
        }

        @ReactProp(name = "markerHeight")
        public void setMarkerHeight(MarkerView node, Dynamic markerHeight) {
            node.setMarkerHeight(markerHeight);
        }

        @ReactProp(name = "markerUnits")
        public void setMarkerUnits(MarkerView node, String markerUnits) {
            node.setMarkerUnits(markerUnits);
        }

        @ReactProp(name = "orient")
        public void setOrient(MarkerView node, String orient) {
            node.setOrient(orient);
        }

        @ReactProp(name = "minX")
        public void setMinX(MarkerView node, float minX) {
            node.setMinX(minX);
        }

        @ReactProp(name = "minY")
        public void setMinY(MarkerView node, float minY) {
            node.setMinY(minY);
        }

        @ReactProp(name = "vbWidth")
        public void setVbWidth(MarkerView node, float vbWidth) {
            node.setVbWidth(vbWidth);
        }

        @ReactProp(name = "vbHeight")
        public void setVbHeight(MarkerView node, float vbHeight) {
            node.setVbHeight(vbHeight);
        }

        @ReactProp(name = "align")
        public void setAlign(MarkerView node, String align) {
            node.setAlign(align);
        }

        @ReactProp(name = "meetOrSlice")
        public void setMeetOrSlice(MarkerView node, int meetOrSlice) {
            node.setMeetOrSlice(meetOrSlice);
        }
    }

    static class LinearGradientManager extends RenderableViewManager {
        LinearGradientManager() {
            super(SVGClass.RNSVGLinearGradient);
        }

        @ReactProp(name = "x1")
        public void setX1(LinearGradientView node, Dynamic x1) {
            node.setX1(x1);
        }

        @ReactProp(name = "y1")
        public void setY1(LinearGradientView node, Dynamic y1) {
            node.setY1(y1);
        }

        @ReactProp(name = "x2")
        public void setX2(LinearGradientView node, Dynamic x2) {
            node.setX2(x2);
        }

        @ReactProp(name = "y2")
        public void setY2(LinearGradientView node, Dynamic y2) {
            node.setY2(y2);
        }

        @ReactProp(name = "gradient")
        public void setGradient(LinearGradientView node, ReadableArray gradient) {
            node.setGradient(gradient);
        }

        @ReactProp(name = "gradientUnits")
        public void setGradientUnits(LinearGradientView node, int gradientUnits) {
            node.setGradientUnits(gradientUnits);
        }

        @ReactProp(name = "gradientTransform")
        public void setGradientTransform(LinearGradientView node, @Nullable ReadableArray matrixArray) {
            node.setGradientTransform(matrixArray);
        }
    }

    static class RadialGradientManager extends RenderableViewManager {
        RadialGradientManager() {
            super(SVGClass.RNSVGRadialGradient);
        }

        @ReactProp(name = "fx")
        public void setFx(RadialGradientView node, Dynamic fx) {
            node.setFx(fx);
        }

        @ReactProp(name = "fy")
        public void setFy(RadialGradientView node, Dynamic fy) {
            node.setFy(fy);
        }

        @ReactProp(name = "rx")
        public void setRx(RadialGradientView node, Dynamic rx) {
            node.setRx(rx);
        }

        @ReactProp(name = "ry")
        public void setRy(RadialGradientView node, Dynamic ry) {
            node.setRy(ry);
        }

        @ReactProp(name = "cx")
        public void setCx(RadialGradientView node, Dynamic cx) {
            node.setCx(cx);
        }

        @ReactProp(name = "cy")
        public void setCy(RadialGradientView node, Dynamic cy) {
            node.setCy(cy);
        }

        @ReactProp(name = "gradient")
        public void setGradient(RadialGradientView node, ReadableArray gradient) {
            node.setGradient(gradient);
        }

        @ReactProp(name = "gradientUnits")
        public void setGradientUnits(RadialGradientView node, int gradientUnits) {
            node.setGradientUnits(gradientUnits);
        }

        @ReactProp(name = "gradientTransform")
        public void setGradientTransform(RadialGradientView node, @Nullable ReadableArray matrixArray) {
            node.setGradientTransform(matrixArray);
        }
    }

    private RenderableViewManager(SVGClass svgclass) {
        svgClass = svgclass;
        mClassName = svgclass.toString();
    }

    @Nonnull
    @Override
    public String getName() {
        return mClassName;
    }

    @ReactProp(name = "mask")
    public void setMask(VirtualView node, String mask) {
        node.setMask(mask);
    }

    @ReactProp(name = "markerStart")
    public void setMarkerStart(VirtualView node, String markerStart) {
        node.setMarkerStart(markerStart);
    }

    @ReactProp(name = "markerMid")
    public void setMarkerMid(VirtualView node, String markerMid) {
        node.setMarkerMid(markerMid);
    }

    @ReactProp(name = "markerEnd")
    public void setMarkerEnd(VirtualView node, String markerEnd) {
        node.setMarkerEnd(markerEnd);
    }

    @ReactProp(name = "clipPath")
    public void setClipPath(VirtualView node, String clipPath) {
        node.setClipPath(clipPath);
    }

    @ReactProp(name = "clipRule")
    public void setClipRule(VirtualView node, int clipRule) {
        node.setClipRule(clipRule);
    }

    @ReactProp(name = "opacity", defaultFloat = 1f)
    public void setOpacity(@Nonnull VirtualView node, float opacity) {
        node.setOpacity(opacity);
    }

    @ReactProp(name = "fill")
    public void setFill(RenderableView node, @Nullable Dynamic fill) {
        node.setFill(fill);
    }

    @ReactProp(name = "fillOpacity", defaultFloat = 1f)
    public void setFillOpacity(RenderableView node, float fillOpacity) {
        node.setFillOpacity(fillOpacity);
    }

    @ReactProp(name = "fillRule", defaultInt = FILL_RULE_NONZERO)
    public void setFillRule(RenderableView node, int fillRule) {
        node.setFillRule(fillRule);
    }


    @ReactProp(name = "stroke")
    public void setStroke(RenderableView node, @Nullable Dynamic strokeColors) {
        node.setStroke(strokeColors);
    }

    @ReactProp(name = "strokeOpacity", defaultFloat = 1f)
    public void setStrokeOpacity(RenderableView node, float strokeOpacity) {
        node.setStrokeOpacity(strokeOpacity);
    }

    @ReactProp(name = "strokeDasharray")
    public void setStrokeDasharray(RenderableView node, @Nullable ReadableArray strokeDasharray) {
        node.setStrokeDasharray(strokeDasharray);
    }

    @ReactProp(name = "strokeDashoffset")
    public void setStrokeDashoffset(RenderableView node, float strokeDashoffset) {
        node.setStrokeDashoffset(strokeDashoffset);
    }

    @ReactProp(name = "strokeWidth")
    public void setStrokeWidth(RenderableView node, Dynamic strokeWidth) {
        node.setStrokeWidth(strokeWidth);
    }

    @ReactProp(name = "strokeMiterlimit", defaultFloat = 4f)
    public void setStrokeMiterlimit(RenderableView node, float strokeMiterlimit) {
        node.setStrokeMiterlimit(strokeMiterlimit);
    }

    @ReactProp(name = "strokeLinecap", defaultInt = CAP_ROUND)
    public void setStrokeLinecap(RenderableView node, int strokeLinecap) {
        node.setStrokeLinecap(strokeLinecap);
    }

    @ReactProp(name = "strokeLinejoin", defaultInt = JOIN_ROUND)
    public void setStrokeLinejoin(RenderableView node, int strokeLinejoin) {
        node.setStrokeLinejoin(strokeLinejoin);
    }

    @ReactProp(name = "vectorEffect")
    public void setVectorEffect(RenderableView node, int vectorEffect) {
        node.setVectorEffect(vectorEffect);
    }

    @ReactProp(name = "matrix")
    public void setMatrix(VirtualView node, Dynamic matrixArray) {
        node.setMatrix(matrixArray);
    }

    @ReactProp(name = "transform")
    public void setTransform(VirtualView node, Dynamic matrix) {
        if (matrix.getType() != ReadableType.Array) {
            return;
        }
        ReadableArray ma = matrix.asArray();
        if (ma == null) {
            resetTransformProperty(node);
        } else {
            setTransformProperty(node, ma);
        }
        Matrix m = node.getMatrix();
        node.mTransform = m;
        node.mTransformInvertible = m.invert(node.mInvTransform);
    }

    @ReactProp(name = "propList")
    public void setPropList(RenderableView node, @Nullable ReadableArray propList) {
        node.setPropList(propList);
    }

    @ReactProp(name = "responsible")
    public void setResponsible(VirtualView node, boolean responsible) {
        node.setResponsible(responsible);
    }

    @ReactProp(name = ViewProps.POINTER_EVENTS)
    public void setPointerEvents(VirtualView view, @androidx.annotation.Nullable String pointerEventsStr) {
        if (pointerEventsStr == null) {
            view.setPointerEvents(PointerEvents.AUTO);
        } else {
            PointerEvents pointerEvents =
                    PointerEvents.valueOf(pointerEventsStr.toUpperCase(Locale.US).replace("-", "_"));
            view.setPointerEvents(pointerEvents);
        }
    }

    @ReactProp(name = "onLayout")
    public void setOnLayout(VirtualView node, boolean onLayout) {
        node.setOnLayout(onLayout);
    }

    @ReactProp(name = "name")
    public void setName(VirtualView node, String name) {
        node.setName(name);
    }

    @ReactProp(name = "display")
    public void setDisplay(VirtualView node, String display) {
        node.setDisplay(display);
    }

    private void invalidateSvgView(VirtualView node) {
        SvgView view = node.getSvgView();
        if (view!= null) {
            view.invalidate();
        }
        if (node instanceof TextView) {
            ((TextView)node).getTextContainer().clearChildCache();
        }
    }

    @Override
    protected void addEventEmitters(@Nonnull ThemedReactContext reactContext, @Nonnull VirtualView view) {
        super.addEventEmitters(reactContext, view);
        view.setOnHierarchyChangeListener(new ViewGroup.OnHierarchyChangeListener() {
            @Override
            public void onChildViewAdded(View view, View view1) {
                if (view instanceof VirtualView) {
                    invalidateSvgView((VirtualView) view);
                }
            }

            @Override
            public void onChildViewRemoved(View view, View view1) {
                if (view instanceof VirtualView) {
                    invalidateSvgView((VirtualView) view);
                }
            }
        });
    }

    /**
     * Callback that will be triggered after all properties are updated in current update transaction
     * (all @ReactProp handlers for properties updated in current transaction have been called). If
     * you want to override this method you should call super.onAfterUpdateTransaction from it as
     * the parent class of the ViewManager may rely on callback being executed.
     */
    @Override
    protected void onAfterUpdateTransaction(@Nonnull VirtualView node) {
        super.onAfterUpdateTransaction(node);
        invalidateSvgView(node);
    }

    @Nonnull
    @Override
    protected VirtualView createViewInstance(@Nonnull ThemedReactContext reactContext) {
        switch (svgClass) {
            case RNSVGGroup:
                return new GroupView(reactContext);
            case RNSVGPath:
                return new PathView(reactContext);
            case RNSVGCircle:
                return new CircleView(reactContext);
            case RNSVGEllipse:
                return new EllipseView(reactContext);
            case RNSVGLine:
                return new LineView(reactContext);
            case RNSVGRect:
                return new RectView(reactContext);
            case RNSVGText:
                return new TextView(reactContext);
            case RNSVGTSpan:
                return new TSpanView(reactContext);
            case RNSVGTextPath:
                return new TextPathView(reactContext);
            case RNSVGImage:
                return new ImageView(reactContext);
            case RNSVGClipPath:
                return new ClipPathView(reactContext);
            case RNSVGDefs:
                return new DefsView(reactContext);
            case RNSVGUse:
                return new UseView(reactContext);
            case RNSVGSymbol:
                return new SymbolView(reactContext);
            case RNSVGLinearGradient:
                return new LinearGradientView(reactContext);
            case RNSVGRadialGradient:
                return new RadialGradientView(reactContext);
            case RNSVGPattern:
                return new PatternView(reactContext);
            case RNSVGMask:
                return new MaskView(reactContext);
            case RNSVGMarker:
                return new MarkerView(reactContext);
            case RNSVGForeignObject:
                return new ForeignObjectView(reactContext);
            default:
                throw new IllegalStateException("Unexpected type " + svgClass.toString());
        }
    }

    private static final SparseArray<RenderableView> mTagToRenderableView = new SparseArray<>();
    private static final SparseArray<Runnable> mTagToRunnable = new SparseArray<>();

    static void setRenderableView(int tag, RenderableView svg) {
        mTagToRenderableView.put(tag, svg);
        Runnable task = mTagToRunnable.get(tag);
        if (task != null) {
            task.run();
            mTagToRunnable.delete(tag);
        }
    }

    static void runWhenViewIsAvailable(int tag, Runnable task) {
        mTagToRunnable.put(tag, task);
    }

    static @Nullable RenderableView getRenderableViewByTag(int tag) {
        return mTagToRenderableView.get(tag);
    }

    @Override
    public void onDropViewInstance(@Nonnull VirtualView view) {
        super.onDropViewInstance(view);
        mTagToRenderableView.remove(view.getId());
    }
}
