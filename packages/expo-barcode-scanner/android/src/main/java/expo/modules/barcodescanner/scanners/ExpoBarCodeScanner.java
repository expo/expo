package expo.modules.barcodescanner.scanners;

import android.content.Context;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import expo.interfaces.barcodescanner.BarCodeScanner;
import expo.interfaces.barcodescanner.BarCodeScannerSettings;

public abstract class ExpoBarCodeScanner implements BarCodeScanner {

  protected Context mContext;
  protected List<Integer> mBarCodeTypes;

  ExpoBarCodeScanner(Context context) {
    mContext = context;
  }

  boolean areNewAndOldBarCodeTypesEqual(List<Integer> newBarCodeTypes) {
    if (mBarCodeTypes == null) {
      return false;
    }

    // create distinct-values sets
    Set<Integer> prevTypesSet = new HashSet<>(mBarCodeTypes);
    Set<Integer> nextTypesSet = new HashSet<>(newBarCodeTypes);

    // sets sizes are equal -> possible content equality
    if (prevTypesSet.size() == nextTypesSet.size()) {
      prevTypesSet.removeAll(nextTypesSet);
      // every element from new set was in previous one -> sets are equal
      return prevTypesSet.isEmpty();
    }
    return false;
  }

  @SuppressWarnings("unchecked")
  List<Integer> parseBarCodeTypesFromSettings(BarCodeScannerSettings settings) {
    Object newBarCodeTypesObject = settings.getTypes();
    if (newBarCodeTypesObject == null || !(newBarCodeTypesObject instanceof List)) {
      return null;
    }
    List<Integer> result = new ArrayList<>();
    List<Object> newBarCodeTypesObjectsList = (List) newBarCodeTypesObject;
    for (Object element : newBarCodeTypesObjectsList) {
      if (element instanceof Number) {
        result.add(((Number) element).intValue());
      }
    }
    return result;
  }

  public abstract boolean isAvailable();
}
