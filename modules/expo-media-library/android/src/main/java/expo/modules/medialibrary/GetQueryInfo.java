package expo.modules.medialibrary;

import android.provider.MediaStore;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_ALL;
import static expo.modules.medialibrary.MediaLibraryUtils.convertMediaType;
import static expo.modules.medialibrary.MediaLibraryUtils.mapOrderDescriptor;

class GetQueryInfo {
  private Map<String, Object> mInput;
  private int mLimit;
  private StringBuilder mSelection;
  private StringBuilder mOrder;
  private int mOffset;

  GetQueryInfo(Map<String, Object> input) {
    mInput = input;
  }

  int getLimit() {
    return mLimit;
  }

  int getOffset() {
    return mOffset;
  }

  String getSelection() {
    return mSelection.toString();
  }

  String getOrder() {
    return mOrder.toString();
  }

  public GetQueryInfo invoke() {
    mLimit = mInput.containsKey("first") ? ((Double) mInput.get("first")).intValue() : 20;

    mSelection = new StringBuilder();
    if (mInput.containsKey("album")) {
      mSelection.append(MediaStore.Images.Media.BUCKET_ID).append(" = ").append(mInput.get("album"));
      mSelection.append(" AND ");
    }

    List<Object> mediaType = mInput.containsKey("mediaType") ? (List<Object>) mInput.get("mediaType") : null;

    if (mediaType != null && !mediaType.contains(MEDIA_TYPE_ALL)) {
      List<Integer> mediaTypeInts = new ArrayList<Integer>();

      for (Object mediaTypeStr : mediaType) {
        mediaTypeInts.add(convertMediaType(mediaTypeStr.toString()));
      }
      mSelection.append(MediaStore.Files.FileColumns.MEDIA_TYPE).append(" IN (").append(TextUtils.join(",", mediaTypeInts)).append(")");
    } else {
      mSelection.append(MediaStore.Files.FileColumns.MEDIA_TYPE).append(" != ").append(MediaStore.Files.FileColumns.MEDIA_TYPE_NONE);
    }

    mOrder = new StringBuilder();
    if (mInput.containsKey("sortBy") && ((List) mInput.get("sortBy")).size() > 0) {
      mOrder.append(mapOrderDescriptor((List) mInput.get("sortBy")));
    } else {
      mOrder.append(MediaStore.Images.Media.DEFAULT_SORT_ORDER);
    }

    // to maintain compatibility with IOS field after is in string object
    mOffset = mInput.containsKey("after") ?
        Integer.parseInt((String) mInput.get("after")) : 0;
    return this;
  }
}
