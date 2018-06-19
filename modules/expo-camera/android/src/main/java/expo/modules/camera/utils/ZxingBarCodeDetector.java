package expo.modules.camera.utils;

import android.content.Context;

import com.google.android.gms.vision.barcode.Barcode;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.NotFoundException;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.common.HybridBinarizer;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ZxingBarCodeDetector extends ExpoBarCodeDetector {

  private final MultiFormatReader mMultiFormatReader = new MultiFormatReader();

  public ZxingBarCodeDetector(List<Integer> barCodeTypes, Context context) {
    super(barCodeTypes, context);
    EnumMap<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);
    EnumSet<BarcodeFormat> decodeFormats = EnumSet.noneOf(BarcodeFormat.class);

    if (mBarCodeTypes != null) {
      for (int code : mBarCodeTypes) {
        String formatString = VALID_BARCODE_TYPES.get(code);
        if (formatString != null) {
          decodeFormats.add(BarcodeFormat.valueOf(formatString));
        }
      }
    }

    hints.put(DecodeHintType.POSSIBLE_FORMATS, decodeFormats);
    mMultiFormatReader.setHints(hints);
  }

  @Override
  public Result detect(byte[] data, int width, int height, int rotation) {
    com.google.zxing.Result barcode = null;
    try {
      // rotate for zxing if orientation is portrait
      if (rotation == 0) {
        byte[] rotated = new byte[data.length];
        for (int y = 0; y < height; y++) {
          for (int x = 0; x < width; x++) {
            rotated[x * height + height - y - 1] = data[x + y * width];
          }
        }
        width = width + height;
        height = width - height;
        width = width - height;
        data = rotated;
      }

      BinaryBitmap bitmap = generateBitmapFromImageData(data, width, height);
      barcode = mMultiFormatReader.decodeWithState(bitmap);
    } catch (NotFoundException e) {
      // No barcode found, result is already null.
    } catch (Throwable t) {
      t.printStackTrace();
    }

    return barcode != null ? new Result(GMV_FROM_ZXING.get(barcode.getBarcodeFormat()), barcode.getText()) : null;
  }

  @Override
  public boolean isAvailable() {
    return true;
  }

  private BinaryBitmap generateBitmapFromImageData(byte[] imageData, int width, int height) {
        PlanarYUVLuminanceSource source = new PlanarYUVLuminanceSource(
                imageData, // byte[] yuvData
                width, // int dataWidth
                height, // int dataHeight
                0, // int left
                0, // int top
                width, // int width
                height, // int height
                false // boolean reverseHorizontal
                );
        return new BinaryBitmap(new HybridBinarizer(source));
      }

  private static final Map<Integer, String> VALID_BARCODE_TYPES =
      Collections.unmodifiableMap(new HashMap<Integer, String>() {
        {
          put(Barcode.AZTEC, BarcodeFormat.AZTEC.toString());
          put(Barcode.EAN_13, BarcodeFormat.EAN_13.toString());
          put(Barcode.EAN_8, BarcodeFormat.EAN_8.toString());
          put(Barcode.QR_CODE, BarcodeFormat.QR_CODE.toString());
          put(Barcode.PDF417, BarcodeFormat.PDF_417.toString());
          put(Barcode.UPC_E, BarcodeFormat.UPC_E.toString());
          put(Barcode.DATA_MATRIX, BarcodeFormat.DATA_MATRIX.toString());
          put(Barcode.CODE_39, BarcodeFormat.CODE_39.toString());
          put(Barcode.CODE_93, BarcodeFormat.CODE_93.toString());
          put(Barcode.ITF, BarcodeFormat.ITF.toString());
          put(Barcode.CODABAR, BarcodeFormat.CODABAR.toString());
          put(Barcode.CODE_128, BarcodeFormat.CODE_128.toString());
          put(Barcode.UPC_A, BarcodeFormat.UPC_A.toString());
        }
      });

  private static final Map<BarcodeFormat, Integer> GMV_FROM_ZXING =
      Collections.unmodifiableMap(new HashMap<BarcodeFormat, Integer>() {
        {
          put(BarcodeFormat.AZTEC, Barcode.AZTEC);
          put(BarcodeFormat.EAN_13, Barcode.EAN_13);
          put(BarcodeFormat.EAN_8, Barcode.EAN_8);
          put(BarcodeFormat.QR_CODE, Barcode.QR_CODE);
          put(BarcodeFormat.PDF_417, Barcode.PDF417);
          put(BarcodeFormat.UPC_E, Barcode.UPC_E);
          put(BarcodeFormat.DATA_MATRIX, Barcode.DATA_MATRIX);
          put(BarcodeFormat.CODE_39, Barcode.CODE_39);
          put(BarcodeFormat.CODE_93, Barcode.CODE_93);
          put(BarcodeFormat.ITF, Barcode.ITF);
          put(BarcodeFormat.CODABAR, Barcode.CODABAR);
          put(BarcodeFormat.CODE_128, Barcode.CODE_128);
          put(BarcodeFormat.UPC_A, Barcode.UPC_A);
        }
      });
}
