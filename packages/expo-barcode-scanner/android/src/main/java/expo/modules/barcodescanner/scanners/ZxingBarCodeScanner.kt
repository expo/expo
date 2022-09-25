package expo.modules.barcodescanner.scanners

import android.content.Context
import android.graphics.Bitmap
import com.google.android.gms.vision.barcode.Barcode
import com.google.zxing.BarcodeFormat
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.LuminanceSource
import com.google.zxing.MultiFormatReader
import com.google.zxing.NotFoundException
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.RGBLuminanceSource
import com.google.zxing.Result
import com.google.zxing.common.HybridBinarizer
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import java.util.*

class ZxingBarCodeScanner(context: Context) : ExpoBarCodeScanner(context) {
  private val mMultiFormatReader: MultiFormatReader = MultiFormatReader()
  override fun scanMultiple(bitmap: Bitmap): List<BarCodeScannerResult> {
    val intArray = IntArray(bitmap.width * bitmap.height)
    bitmap.getPixels(
      intArray, 0, bitmap.width, 0, 0,
      bitmap.width, bitmap.height
    )
    val source: LuminanceSource = RGBLuminanceSource(bitmap.width, bitmap.height, intArray)
    val result = scan(source)
    return result?.let { listOf(it) } ?: emptyList()
  }

  override val isAvailable = true

  override fun scan(data: ByteArray, width: Int, height: Int, rotation: Int): BarCodeScannerResult? {
    // rotate for zxing if orientation is portrait
    var innerData = data
    var innerWidth = width
    var innerHeight = height
    if (rotation == 0) {
      val rotated = ByteArray(innerData.size)
      for (y in 0 until innerHeight) {
        for (x in 0 until innerWidth) {
          val sourceIx = x + y * innerWidth
          val destIx = x * innerHeight + innerHeight - y - 1
          if (sourceIx >= 0 && sourceIx < innerData.size && destIx >= 0 && destIx < innerData.size) {
            rotated[destIx] = innerData[sourceIx]
          }
        }
      }
      innerWidth += innerHeight
      innerHeight = innerWidth - innerHeight
      innerWidth -= innerHeight
      innerData = rotated
    }
    return scan(generateSourceFromImageData(innerData, innerWidth, innerHeight))
  }

  private fun scan(source: LuminanceSource): BarCodeScannerResult? {
    var barcode: Result? = null
    var bitmap: BinaryBitmap? = null
    try {
      bitmap = BinaryBitmap(HybridBinarizer(source))
      barcode = mMultiFormatReader.decodeWithState(bitmap)
    } catch (e: NotFoundException) {
      // No barcode found, result is already null.
    } catch (t: Throwable) {
      t.printStackTrace()
    }
    if (bitmap == null || barcode == null) {
      return null
    }
    val cornerPoints = ArrayList<Int>() // empty list
    val type = GMV_FROM_ZXING[barcode.barcodeFormat] ?: return null
    return BarCodeScannerResult(type, barcode.text, cornerPoints, bitmap.height, bitmap.width)
  }

  override fun setSettings(settings: BarCodeScannerSettings) {
    val newBarCodeTypes = parseBarCodeTypesFromSettings(settings)
    if (areNewAndOldBarCodeTypesEqual(newBarCodeTypes)) {
      return
    }
    val hints = EnumMap<DecodeHintType, Any?>(DecodeHintType::class.java)
    val decodeFormats = EnumSet.noneOf(BarcodeFormat::class.java)
    barCodeTypes?.forEach {
      val formatString = VALID_BARCODE_TYPES[it]
      if (formatString != null) {
        decodeFormats.add(BarcodeFormat.valueOf(formatString))
      }
    }
    hints[DecodeHintType.POSSIBLE_FORMATS] = decodeFormats
    mMultiFormatReader.setHints(hints)
  }

  private fun generateSourceFromImageData(imageData: ByteArray, width: Int, height: Int): LuminanceSource {
    return PlanarYUVLuminanceSource(
      imageData, // byte[] yuvData
      width, // int dataWidth
      height, // int dataHeight
      0, // int left
      0, // int top
      width, // int width
      height, // int height
      false // boolean reverseHorizontal
    )
  }

  companion object {
    private val VALID_BARCODE_TYPES = mapOf(
      Barcode.AZTEC to BarcodeFormat.AZTEC.toString(),
      Barcode.EAN_13 to BarcodeFormat.EAN_13.toString(),
      Barcode.EAN_8 to BarcodeFormat.EAN_8.toString(),
      Barcode.QR_CODE to BarcodeFormat.QR_CODE.toString(),
      Barcode.PDF417 to BarcodeFormat.PDF_417.toString(),
      Barcode.UPC_E to BarcodeFormat.UPC_E.toString(),
      Barcode.DATA_MATRIX to BarcodeFormat.DATA_MATRIX.toString(),
      Barcode.CODE_39 to BarcodeFormat.CODE_39.toString(),
      Barcode.CODE_93 to BarcodeFormat.CODE_93.toString(),
      Barcode.ITF to BarcodeFormat.ITF.toString(),
      Barcode.CODABAR to BarcodeFormat.CODABAR.toString(),
      Barcode.CODE_128 to BarcodeFormat.CODE_128.toString(),
      Barcode.UPC_A to BarcodeFormat.UPC_A.toString(),
    )
    private val GMV_FROM_ZXING: Map<BarcodeFormat, Int> = mapOf(
      BarcodeFormat.AZTEC to Barcode.AZTEC,
      BarcodeFormat.EAN_13 to Barcode.EAN_13,
      BarcodeFormat.EAN_8 to Barcode.EAN_8,
      BarcodeFormat.QR_CODE to Barcode.QR_CODE,
      BarcodeFormat.PDF_417 to Barcode.PDF417,
      BarcodeFormat.UPC_E to Barcode.UPC_E,
      BarcodeFormat.DATA_MATRIX to Barcode.DATA_MATRIX,
      BarcodeFormat.CODE_39 to Barcode.CODE_39,
      BarcodeFormat.CODE_93 to Barcode.CODE_93,
      BarcodeFormat.ITF to Barcode.ITF,
      BarcodeFormat.CODABAR to Barcode.CODABAR,
      BarcodeFormat.CODE_128 to Barcode.CODE_128,
      BarcodeFormat.UPC_A to Barcode.UPC_A,
    )
  }
}
