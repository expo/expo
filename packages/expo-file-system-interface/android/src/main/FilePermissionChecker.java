package main;

import android.content.Context;
import java.util.EnumSet;

public interface FilePermissionChecker {
  EnumSet<Permission> getInfo(Context context, String path);
}

