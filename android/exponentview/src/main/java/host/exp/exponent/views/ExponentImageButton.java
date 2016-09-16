// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.views;

import android.content.Context;
import android.graphics.Color;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ImageButton;

public class ExponentImageButton extends ImageButton {

  public ExponentImageButton(Context context) {
    super(context);
    init();
  }

  public ExponentImageButton(Context context, AttributeSet attrs) {
    super(context, attrs);
    init();
  }

  public ExponentImageButton(Context context, AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    init();
  }

  private void init() {
    setOnTouchListener(new View.OnTouchListener() {
      @Override
      public boolean onTouch(View v, MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_UP) {
          setColorFilter(Color.TRANSPARENT);
        } else if (event.getAction() == MotionEvent.ACTION_DOWN) {
          setColorFilter(Color.GRAY);
        }
        return false;
      }
    });
  }
}
