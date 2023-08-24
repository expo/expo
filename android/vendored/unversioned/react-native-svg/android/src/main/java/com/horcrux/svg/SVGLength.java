package com.horcrux.svg;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import java.util.ArrayList;

class SVGLength {
  // https://www.w3.org/TR/SVG/types.html#InterfaceSVGLength
  public enum UnitType {
    UNKNOWN,
    NUMBER,
    PERCENTAGE,
    EMS,
    EXS,
    PX,
    CM,
    MM,
    IN,
    PT,
    PC,
  }

  final double value;
  final UnitType unit;

  private SVGLength() {
    value = 0;
    unit = UnitType.UNKNOWN;
  }

  SVGLength(double number) {
    value = number;
    unit = UnitType.NUMBER;
  }

  private SVGLength(String length) {
    length = length.trim();
    int stringLength = length.length();
    int percentIndex = stringLength - 1;
    if (stringLength == 0 || length.equals("normal")) {
      unit = UnitType.UNKNOWN;
      value = 0;
    } else if (length.codePointAt(percentIndex) == '%') {
      unit = UnitType.PERCENTAGE;
      value = Double.valueOf(length.substring(0, percentIndex));
    } else {
      int twoLetterUnitIndex = stringLength - 2;
      if (twoLetterUnitIndex > 0) {
        String lastTwo = length.substring(twoLetterUnitIndex);
        int end = twoLetterUnitIndex;
        switch (lastTwo) {
          case "px":
            unit = UnitType.NUMBER;
            break;

          case "em":
            unit = UnitType.EMS;
            break;
          case "ex":
            unit = UnitType.EXS;
            break;

          case "pt":
            unit = UnitType.PT;
            break;

          case "pc":
            unit = UnitType.PC;
            break;

          case "mm":
            unit = UnitType.MM;
            break;

          case "cm":
            unit = UnitType.CM;
            break;

          case "in":
            unit = UnitType.IN;
            break;

          default:
            unit = UnitType.NUMBER;
            end = stringLength;
        }
        value = Double.valueOf(length.substring(0, end));
      } else {
        unit = UnitType.NUMBER;
        value = Double.valueOf(length);
      }
    }
  }

  static SVGLength from(Dynamic dynamic) {
    switch (dynamic.getType()) {
      case Number:
        return new SVGLength(dynamic.asDouble());
      case String:
        return new SVGLength(dynamic.asString());
      default:
        return new SVGLength();
    }
  }

  static SVGLength from(String string) {
    return string != null ? new SVGLength(string) : new SVGLength();
  }

  static SVGLength from(Double value) {
    return value != null ? new SVGLength(value) : new SVGLength();
  }

  static String toString(Dynamic dynamic) {
    switch (dynamic.getType()) {
      case Number:
        return String.valueOf(dynamic.asDouble());
      case String:
        return dynamic.asString();
      default:
        return null;
    }
  }

  static ArrayList<SVGLength> arrayFrom(Dynamic dynamic) {
    switch (dynamic.getType()) {
      case Number:
        {
          ArrayList<SVGLength> list = new ArrayList<>(1);
          list.add(new SVGLength(dynamic.asDouble()));
          return list;
        }
      case Array:
        {
          ReadableArray arr = dynamic.asArray();
          int size = arr.size();
          ArrayList<SVGLength> list = new ArrayList<>(size);
          for (int i = 0; i < size; i++) {
            Dynamic val = arr.getDynamic(i);
            list.add(from(val));
          }
          return list;
        }
      case String:
        {
          ArrayList<SVGLength> list = new ArrayList<>(1);
          list.add(new SVGLength(dynamic.asString()));
          return list;
        }
      default:
        return null;
    }
  }

  static ArrayList<SVGLength> arrayFrom(ReadableArray arr) {
    int size = arr.size();
    ArrayList<SVGLength> list = new ArrayList<>(size);
    for (int i = 0; i < size; i++) {
      Dynamic val = arr.getDynamic(i);
      list.add(from(val));
    }
    return list;
  }
}
