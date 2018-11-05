package abi30_0_0.host.exp.exponent.modules.api.components.maps;


import android.graphics.Bitmap;

import com.google.android.gms.maps.model.BitmapDescriptor;

public interface ImageReadable {

  public void setIconBitmap(Bitmap bitmap);

  public void setIconBitmapDescriptor(BitmapDescriptor bitmapDescriptor);

  public void update();
}
