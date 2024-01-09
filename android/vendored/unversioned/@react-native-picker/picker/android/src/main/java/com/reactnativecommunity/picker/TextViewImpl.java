package com.reactnativecommunity.picker;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.TextView;

public class TextViewImpl extends TextView {
    public TextViewImpl(Context context) {
        super(context);
    }

    public TextViewImpl(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public TextViewImpl(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public TextViewImpl(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    @Override
    public void setHorizontallyScrolling(boolean whether) {
        // scrolling breaks multiline texts
    }
}
