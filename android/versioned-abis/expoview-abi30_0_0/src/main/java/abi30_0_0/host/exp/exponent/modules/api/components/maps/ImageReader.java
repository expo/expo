package abi30_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Animatable;
import android.net.Uri;

import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.BaseControllerListener;
import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.drawable.ScalingUtils;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.view.DraweeHolder;
import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.image.CloseableStaticBitmap;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;

import javax.annotation.Nullable;

public class ImageReader {

  private final ImageReadable imp;
  private final Context context;
  private final Resources resources;

  private final DraweeHolder<?> logoHolder;
  private DataSource<CloseableReference<CloseableImage>> dataSource;

  private final ControllerListener<ImageInfo> mLogoControllerListener =
      new BaseControllerListener<ImageInfo>() {
        @Override
        public void onFinalImageSet(
            String id,
            @Nullable final ImageInfo imageInfo,
            @Nullable Animatable animatable) {
          CloseableReference<CloseableImage> imageReference = null;
          try {
            imageReference = dataSource.getResult();
            if (imageReference != null) {
              CloseableImage image = imageReference.get();
              if (image != null && image instanceof CloseableStaticBitmap) {
                CloseableStaticBitmap closeableStaticBitmap = (CloseableStaticBitmap) image;
                Bitmap bitmap = closeableStaticBitmap.getUnderlyingBitmap();
                if (bitmap != null) {
                  bitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true);
                  imp.setIconBitmap(bitmap);
                  imp.setIconBitmapDescriptor(BitmapDescriptorFactory.fromBitmap(bitmap));
                }
              }
            }
          } finally {
            dataSource.close();
            if (imageReference != null) {
              CloseableReference.closeSafely(imageReference);
            }
          }
          imp.update();
        }
      };

  public ImageReader(Context context, Resources resources, ImageReadable imp) {
    this.context = context;
    this.resources = resources;
    this.imp = imp;
    logoHolder = DraweeHolder.create(createDraweeHeirarchy(resources), context);
    logoHolder.onAttach();
  }

  private GenericDraweeHierarchy createDraweeHeirarchy(Resources resources){
    return new GenericDraweeHierarchyBuilder(resources)
        .setActualImageScaleType(ScalingUtils.ScaleType.FIT_CENTER)
        .setFadeDuration(0)
        .build();
  }

  public void setImage(String uri) {
    if (uri == null) {
      imp.setIconBitmapDescriptor(null);
      imp.update();
    } else if (uri.startsWith("http://") || uri.startsWith("https://") ||
        uri.startsWith("file://") || uri.startsWith("asset://")) {
      ImageRequest imageRequest = ImageRequestBuilder
          .newBuilderWithSource(Uri.parse(uri))
          .build();
      ImagePipeline imagePipeline = Fresco.getImagePipeline();
      dataSource = imagePipeline.fetchDecodedImage(imageRequest, this);

      DraweeController controller = Fresco.newDraweeControllerBuilder()
          .setImageRequest(imageRequest)
          .setControllerListener(mLogoControllerListener)
          .setOldController(logoHolder.getController())
          .build();
      logoHolder.setController(controller);
    } else {
      BitmapDescriptor iconBitmapDescriptor = getBitmapDescriptorByName(uri);
      if (iconBitmapDescriptor != null) {
        imp.setIconBitmapDescriptor(iconBitmapDescriptor);
        imp.setIconBitmap(BitmapFactory.decodeResource(this.resources, getDrawableResourceByName
            (uri)));
      }
      imp.update();
    }


  }

  private int getDrawableResourceByName(String name) {
    return this.resources.getIdentifier(
        name,
        "drawable",
        this.context.getPackageName());
  }

  private BitmapDescriptor getBitmapDescriptorByName(String name) {
    return BitmapDescriptorFactory.fromResource(getDrawableResourceByName(name));
  }

}
