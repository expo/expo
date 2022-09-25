package devmenu.com.th3rdwave.safeareacontext;

import android.annotation.SuppressLint;
import android.content.Context;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.views.view.ReactViewGroup;

import androidx.annotation.Nullable;

@SuppressLint("ViewConstructor")
public class SafeAreaProvider extends ReactViewGroup implements ViewTreeObserver.OnPreDrawListener {
  public interface OnInsetsChangeListener {
    void onInsetsChange(SafeAreaProvider view, EdgeInsets insets, Rect frame);
  }

  private @Nullable OnInsetsChangeListener mInsetsChangeListener;
  private @Nullable EdgeInsets mLastInsets;
  private @Nullable Rect mLastFrame;

  public SafeAreaProvider(Context context) {
    super(context);
  }

  private void maybeUpdateInsets() {
    EdgeInsets edgeInsets = SafeAreaUtils.getSafeAreaInsets(this);
    Rect frame = SafeAreaUtils.getFrame((ViewGroup) getRootView(), this);
    if (edgeInsets != null && frame != null &&
        (mLastInsets == null ||
            mLastFrame == null ||
            !mLastInsets.equalsToEdgeInsets(edgeInsets) ||
            !mLastFrame.equalsToRect(frame))) {
      Assertions.assertNotNull(mInsetsChangeListener).onInsetsChange(this, edgeInsets, frame);
      mLastInsets = edgeInsets;
      mLastFrame = frame;
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();

    getViewTreeObserver().addOnPreDrawListener(this);
    maybeUpdateInsets();
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();

    getViewTreeObserver().removeOnPreDrawListener(this);
  }

  @Override
  public boolean onPreDraw() {
    maybeUpdateInsets();
    return true;
  }


  public void setOnInsetsChangeListener(OnInsetsChangeListener listener) {
    mInsetsChangeListener = listener;
  }
}
