package com.horcrux.svg;

import android.graphics.Paint;
import android.graphics.Path;
import java.util.ArrayList;

class GlyphPathBag {
  private final ArrayList<Path> paths = new ArrayList<>();
  private final int[][] data = new int[256][];
  private final Paint paint;

  GlyphPathBag(Paint paint) {
    this.paint = paint;
    // Make indexed-by-one, to allow zero to represent non-cached
    paths.add(new Path());
  }

  Path getOrCreateAndCache(char ch, String current) {
    int index = getIndex(ch);
    Path cached;

    if (index != 0) {
      cached = paths.get(index);
    } else {
      cached = new Path();
      paint.getTextPath(current, 0, 1, 0, 0, cached);

      int[] bin = data[ch >> 8];
      if (bin == null) {
        bin = data[ch >> 8] = new int[256];
      }
      bin[ch & 0xFF] = paths.size();

      paths.add(cached);
    }

    Path glyph = new Path();
    glyph.addPath(cached);
    return glyph;
  }

  private int getIndex(char ch) {
    int[] bin = data[ch >> 8];
    if (bin == null) return 0;
    return bin[ch & 0xFF];
  }
}
