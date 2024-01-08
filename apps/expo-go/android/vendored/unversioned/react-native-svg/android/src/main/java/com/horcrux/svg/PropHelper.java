/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import com.facebook.react.bridge.ReadableArray;

/** Contains static helper methods for accessing props. */
class PropHelper {

  private static final int inputMatrixDataSize = 6;

  /**
   * Converts given {@link ReadableArray} to a matrix data array, {@code float[6]}. Writes result to
   * the array passed in {@param into}. This method will write exactly six items to the output array
   * from the input array.
   *
   * <p>If the input array has a different size, then only the size is returned; Does not check
   * output array size. Ensure space for at least six elements.
   *
   * @param value input array
   * @param sRawMatrix output matrix
   * @param mScale current resolution scaling
   * @return size of input array
   */
  static int toMatrixData(ReadableArray value, float[] sRawMatrix, float mScale) {
    int fromSize = value.size();
    if (fromSize != inputMatrixDataSize) {
      return fromSize;
    }

    sRawMatrix[0] = (float) value.getDouble(0);
    sRawMatrix[1] = (float) value.getDouble(2);
    sRawMatrix[2] = (float) value.getDouble(4) * mScale;
    sRawMatrix[3] = (float) value.getDouble(1);
    sRawMatrix[4] = (float) value.getDouble(3);
    sRawMatrix[5] = (float) value.getDouble(5) * mScale;

    return inputMatrixDataSize;
  }

  /**
   * Converts length string into px / user units in the current user coordinate system
   *
   * @param length length string
   * @param relative relative size for percentages
   * @param scale scaling parameter
   * @param fontSize current font size
   * @return value in the current user coordinate system
   */
  static double fromRelative(String length, double relative, double scale, double fontSize) {
    /*
        TODO list

        unit  relative to
        em    font size of the element
        ex    x-height of the element’s font
        ch    width of the "0" (ZERO, U+0030) glyph in the element’s font
        rem   font size of the root element
        vw    1% of viewport’s width
        vh    1% of viewport’s height
        vmin  1% of viewport’s smaller dimension
        vmax  1% of viewport’s larger dimension

        relative-size [ larger | smaller ]
        absolute-size: [ xx-small | x-small | small | medium | large | x-large | xx-large ]

        https://www.w3.org/TR/css3-values/#relative-lengths
        https://www.w3.org/TR/css3-values/#absolute-lengths
        https://drafts.csswg.org/css-cascade-4/#computed-value
        https://drafts.csswg.org/css-fonts-3/#propdef-font-size
        https://drafts.csswg.org/css2/fonts.html#propdef-font-size
    */
    length = length.trim();
    int stringLength = length.length();
    int percentIndex = stringLength - 1;
    if (stringLength == 0 || length.equals("normal")) {
      return 0d;
    } else if (length.codePointAt(percentIndex) == '%') {
      return Double.valueOf(length.substring(0, percentIndex)) / 100 * relative;
    } else {
      int twoLetterUnitIndex = stringLength - 2;
      if (twoLetterUnitIndex > 0) {
        String lastTwo = length.substring(twoLetterUnitIndex);
        int end = twoLetterUnitIndex;
        double unit = 1;

        switch (lastTwo) {
          case "px":
            break;

          case "em":
            unit = fontSize;
            break;

            /*
            "1pt" equals "1.25px" (and therefore 1.25 user units)
            "1pc" equals "15px" (and therefore 15 user units)
            "1mm" would be "3.543307px" (3.543307 user units)
            "1cm" equals "35.43307px" (and therefore 35.43307 user units)
            "1in" equals "90px" (and therefore 90 user units)
            */

          case "pt":
            unit = 1.25d;
            break;

          case "pc":
            unit = 15;
            break;

          case "mm":
            unit = 3.543307d;
            break;

          case "cm":
            unit = 35.43307d;
            break;

          case "in":
            unit = 90;
            break;

          default:
            end = stringLength;
        }

        return Double.valueOf(length.substring(0, end)) * unit * scale;
      } else {
        return Double.valueOf(length) * scale;
      }
    }
  }
  /**
   * Converts SVGLength into px / user units in the current user coordinate system
   *
   * @param length length string
   * @param relative relative size for percentages
   * @param offset offset for all units
   * @param scale scaling parameter
   * @param fontSize current font size
   * @return value in the current user coordinate system
   */
  static double fromRelative(
      SVGLength length, double relative, double offset, double scale, double fontSize) {
    /*
        TODO list

        unit  relative to
        em    font size of the element
        ex    x-height of the element’s font
        ch    width of the "0" (ZERO, U+0030) glyph in the element’s font
        rem   font size of the root element
        vw    1% of viewport’s width
        vh    1% of viewport’s height
        vmin  1% of viewport’s smaller dimension
        vmax  1% of viewport’s larger dimension

        relative-size [ larger | smaller ]
        absolute-size: [ xx-small | x-small | small | medium | large | x-large | xx-large ]

        https://www.w3.org/TR/css3-values/#relative-lengths
        https://www.w3.org/TR/css3-values/#absolute-lengths
        https://drafts.csswg.org/css-cascade-4/#computed-value
        https://drafts.csswg.org/css-fonts-3/#propdef-font-size
        https://drafts.csswg.org/css2/fonts.html#propdef-font-size
    */
    if (length == null) {
      return offset;
    }
    SVGLength.UnitType unitType = length.unit;
    double value = length.value;
    double unit = 1;
    switch (unitType) {
      case NUMBER:
      case PX:
        break;

      case PERCENTAGE:
        return value / 100 * relative + offset;

      case EMS:
        unit = fontSize;
        break;
      case EXS:
        unit = fontSize / 2;
        break;

      case CM:
        unit = 35.43307;
        break;
      case MM:
        unit = 3.543307;
        break;
      case IN:
        unit = 90;
        break;
      case PT:
        unit = 1.25;
        break;
      case PC:
        unit = 15;
        break;

      default:
      case UNKNOWN:
        return value * scale + offset;
    }
    return value * unit * scale + offset;
  }
}
