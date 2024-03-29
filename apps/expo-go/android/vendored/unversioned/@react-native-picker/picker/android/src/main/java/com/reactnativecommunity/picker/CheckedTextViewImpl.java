package com.reactnativecommunity.picker;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.CheckedTextView;

import androidx.appcompat.widget.AppCompatCheckedTextView;

public class CheckedTextViewImpl extends AppCompatCheckedTextView {
    public CheckedTextViewImpl(Context context) {
        super(context);
    }

    public CheckedTextViewImpl(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public CheckedTextViewImpl(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    public void setHorizontallyScrolling(boolean whether) {
        // scrolling breaks multiline texts
    }
}
