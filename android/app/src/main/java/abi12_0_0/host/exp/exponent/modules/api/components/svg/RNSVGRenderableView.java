/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi12_0_0.host.exp.exponent.modules.api.components.svg;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

/**
 * Custom {@link View} implementation that draws an RNSVGSvg React view and its \children.
 */
public class RNSVGRenderableView extends ViewGroup {

    public RNSVGRenderableView(Context context) {
        super(context);
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {

    }
}
