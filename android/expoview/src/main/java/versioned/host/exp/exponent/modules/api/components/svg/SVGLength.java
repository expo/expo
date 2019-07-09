package versioned.host.exp.exponent.modules.api.components.svg;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;

import java.util.ArrayList;

// https://www.w3.org/TR/SVG/types.html#InterfaceSVGLength
enum SVGLengthUnitType {
    SVG_LENGTHTYPE_UNKNOWN,
    SVG_LENGTHTYPE_NUMBER,
    SVG_LENGTHTYPE_PERCENTAGE,
    SVG_LENGTHTYPE_EMS,
    SVG_LENGTHTYPE_EXS,
    SVG_LENGTHTYPE_PX,
    SVG_LENGTHTYPE_CM,
    SVG_LENGTHTYPE_MM,
    SVG_LENGTHTYPE_IN,
    SVG_LENGTHTYPE_PT,
    SVG_LENGTHTYPE_PC,
}

class SVGLength {
    final double value;
    final SVGLengthUnitType unit;
    private SVGLength() {
        value = 0;
        unit = SVGLengthUnitType.SVG_LENGTHTYPE_UNKNOWN;
    }
    SVGLength(double number) {
        value = number;
        unit = SVGLengthUnitType.SVG_LENGTHTYPE_NUMBER;
    }
    private SVGLength(String length) {
        length = length.trim();
        int stringLength = length.length();
        int percentIndex = stringLength - 1;
        if (stringLength == 0 || length.equals("normal")) {
            unit = SVGLengthUnitType.SVG_LENGTHTYPE_UNKNOWN;
            value = 0;
        } else if (length.codePointAt(percentIndex) == '%') {
            unit = SVGLengthUnitType.SVG_LENGTHTYPE_PERCENTAGE;
            value = Double.valueOf(length.substring(0, percentIndex));
        } else {
            int twoLetterUnitIndex = stringLength - 2;
            if (twoLetterUnitIndex > 0) {
                String lastTwo = length.substring(twoLetterUnitIndex);
                int end = twoLetterUnitIndex;
                switch (lastTwo) {
                    case "px":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_NUMBER;
                        break;

                    case "em":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_EMS;
                        break;
                    case "ex":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_EXS;
                        break;

                    case "pt":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_PT;
                        break;

                    case "pc":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_PC;
                        break;

                    case "mm":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_MM;
                        break;

                    case "cm":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_CM;
                        break;

                    case "in":
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_IN;
                        break;

                    default:
                        unit = SVGLengthUnitType.SVG_LENGTHTYPE_NUMBER;
                        end = stringLength;
                }
                value = Double.valueOf(length.substring(0, end));
            } else {
                unit = SVGLengthUnitType.SVG_LENGTHTYPE_NUMBER;
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
            case Number: {
                ArrayList<SVGLength> list = new ArrayList<>(1);
                list.add(new SVGLength(dynamic.asDouble()));
                return list;
            }
            case Array: {
                ReadableArray arr = dynamic.asArray();
                int size = arr.size();
                ArrayList<SVGLength> list = new ArrayList<>(size);
                for (int i = 0; i < size; i++) {
                    Dynamic val = arr.getDynamic(i);
                    list.add(from(val));
                }
                return list;
            }
            case String: {
                ArrayList<SVGLength> list = new ArrayList<>(1);
                list.add(new SVGLength(dynamic.asString()));
                return list;
            }
            default:
                return null;
        }
    }
}
