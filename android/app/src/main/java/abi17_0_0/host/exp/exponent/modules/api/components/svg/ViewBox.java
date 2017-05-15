/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi17_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Matrix;
import android.graphics.RectF;

/**
 * Shadow node for virtual ViewBox
 */
public class ViewBox extends GroupShadowNode {

    private static final int MOS_MEET = 0;
    private static final int MOS_SLICE = 1;
    private static final int MOS_NONE = 2;

    static public Matrix getTransform(RectF vbRect, RectF eRect, String align, int meetOrSlice, boolean fromSymbol) {
        // based on https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform

        // Let vb-x, vb-y, vb-width, vb-height be the min-x, min-y, width and height values of the viewBox attribute respectively.
        float vbX = vbRect.left;
        float vbY = vbRect.top;
        float vbWidth = vbRect.width();
        float vbHeight = vbRect.height();

        // Let e-x, e-y, e-width, e-height be the position and size of the element respectively.
        float eX = eRect.left;
        float eY = eRect.top;
        float eWidth = eRect.width();
        float eHeight = eRect.height();


        // Initialize scale-x to e-width/vb-width.
        float scaleX = eWidth / vbWidth;

        // Initialize scale-y to e-height/vb-height.
        float scaleY = eHeight / vbHeight;

        // Initialize translate-x to vb-x - e-x.
        // Initialize translate-y to vb-y - e-y.
        float translateX = vbX - eX;
        float translateY = vbY - eY;

        // If align is 'none'
        if (meetOrSlice == MOS_NONE) {
            // Let scale be set the smaller value of scale-x and scale-y.
            // Assign scale-x and scale-y to scale.
            float scale = scaleX = scaleY = Math.min(scaleX, scaleY);

            // If scale is greater than 1
            if (scale > 1) {
                // Minus translateX by (eWidth / scale - vbWidth) / 2
                // Minus translateY by (eHeight / scale - vbHeight) / 2
                translateX -= (eWidth / scale - vbWidth) / 2;
                translateY -= (eHeight / scale - vbHeight) / 2;
            } else {
                translateX -= (eWidth - vbWidth * scale) / 2;
                translateY -= (eHeight - vbHeight * scale) / 2;
            }
        } else {
// If align is not 'none' and meetOrSlice is 'meet', set the larger of scale-x and scale-y to the smaller.
            // Otherwise, if align is not 'none' and meetOrSlice is 'slice', set the smaller of scale-x and scale-y to the larger.

            if (!align.equals("none") && meetOrSlice == MOS_MEET) {
                scaleX = scaleY = Math.min(scaleX, scaleY);
            } else if (!align.equals("none") && meetOrSlice == MOS_SLICE) {
                scaleX = scaleY = Math.max(scaleX, scaleY);
            }

            // If align contains 'xMid', minus (e-width / scale-x - vb-width) / 2 from transform-x.
            if (align.contains("xMid")) {
                translateX -= (eWidth / scaleX - vbWidth) / 2;
            }

            // If align contains 'xMax', minus (e-width / scale-x - vb-width) from transform-x.
            if (align.contains("xMax")) {
                translateX -= eWidth / scaleX - vbWidth;
            }

            // If align contains 'yMid', minus (e-height / scale-y - vb-height) / 2 from transform-y.
            if (align.contains("YMid")) {
                translateY -= (eHeight / scaleY - vbHeight) / 2;
            }

            // If align contains 'yMax', minus (e-height / scale-y - vb-height) from transform-y.
            if (align.contains("YMax")) {
                translateY -= eHeight / scaleY - vbHeight;
            }

        }

        // The transform applied to content contained by the element is given by
        // translate(translate-x, translate-y) scale(scale-x, scale-y).
        Matrix transform = new Matrix();
        transform.postTranslate(-translateX * (fromSymbol ? scaleX : 1), -translateY * (fromSymbol ? scaleY : 1));
        transform.postScale(scaleX, scaleY);
        return transform;
    }
}
