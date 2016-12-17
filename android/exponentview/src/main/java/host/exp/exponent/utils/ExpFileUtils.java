// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.net.Uri;
import android.support.v4.content.FileProvider;

import java.io.File;

import host.exp.exponentview.Exponent;

public class ExpFileUtils {

  // http://stackoverflow.com/a/38858040/1771921
  public static Uri uriFromFile(File file) {
    try {
      return FileProvider.getUriForFile(Exponent.getInstance().getApplication(), Exponent.getInstance().getApplication().getPackageName() + ".provider", file);
    } catch (Exception e) {
      return Uri.fromFile(file);
    }
  }

}
