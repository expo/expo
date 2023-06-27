package abi49_0_0.host.exp.exponent.modules.api.components.sharedelement;

import android.view.View;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.widget.ImageView;

import com.facebook.drawee.view.GenericDraweeView;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.interfaces.DraweeController;

class RNSharedElementContent {
  View view;
  RectF size;

  static RectF getSize(View view) {
    if (view instanceof GenericDraweeView) {
      GenericDraweeView imageView = (GenericDraweeView) view;
      DraweeController controller = imageView.getController();
      GenericDraweeHierarchy hierarchy = imageView.getHierarchy();
      if (controller == null || controller.toString().contains("fetchedImage=0,")) {
        return null;
      }
      RectF imageBounds = new RectF();
      hierarchy.getActualImageBounds(imageBounds);
      return imageBounds;
    } else if (view instanceof ImageView) {
      ImageView imageView = (ImageView) view;
      Drawable drawable = imageView.getDrawable();
      if (drawable == null) return null;
      int width = drawable.getIntrinsicWidth();
      int height = drawable.getIntrinsicHeight();
      if ((width <= 0) || (height <= 0)) {
        return null;
      }
      return new RectF(0, 0, width, height);
    }
    return new RectF(0, 0, view.getWidth(), view.getHeight());
  }

    /*
    static public Rect getLayout(Rect layout, RectF contentSize, ScaleType scaleType, boolean reverse) {
        float width = layout.width();
        float height = layout.height();
        float contentAspectRatio = (contentSize.width() / contentSize.height());
        boolean lo = (width / height) < contentAspectRatio;
        boolean aspectRatioCriteria = reverse ? !lo : lo;
        if (scaleType == ScaleType.FIT_CENTER) {
            // contain
            if (aspectRatioCriteria) {
                height = width / contentAspectRatio;
            } else {
                width = height * contentAspectRatio;
            }
        } else if (scaleType == ScaleType.CENTER_CROP) {
            // cover
            if (aspectRatioCriteria) {
                width = height * contentAspectRatio;
            } else {
                height = width / contentAspectRatio;
            }
        } else if (scaleType == ScaleType.CENTER_INSIDE) {
            // center
            width = contentSize.width();
            height = contentSize.height();
        }
        return new Rect(
                (int) (layout.left + ((layout.width() - width) / 2)),
                (int) (layout.top + ((layout.height() - height) / 2)),
                (int) (layout.right - ((layout.width() - width) / 2)),
                (int) (layout.bottom - ((layout.height() - height) / 2))
        );
    }*/
}
