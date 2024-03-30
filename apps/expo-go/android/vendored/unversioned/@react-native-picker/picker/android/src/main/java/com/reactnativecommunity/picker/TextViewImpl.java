package com.reactnativecommunity.picker;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.TextView;

import androidx.appcompat.widget.AppCompatTextView;

public class TextViewImpl extends AppCompatTextView {
    public TextViewImpl(Context context) {
        super(context);
    }

    public TextViewImpl(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public TextViewImpl(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    public void setHorizontallyScrolling(boolean whether) {
        // scrolling breaks multiline texts
    }
}
