package abi48_0_0.host.exp.exponent.modules.api.components.picker;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.CheckedTextView;

public class CheckedTextViewImpl extends CheckedTextView {
    public CheckedTextViewImpl(Context context) {
        super(context);
    }

    public CheckedTextViewImpl(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public CheckedTextViewImpl(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public CheckedTextViewImpl(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    @Override
    public void setHorizontallyScrolling(boolean whether) {
        // scrolling breaks multiline texts
    }
}
