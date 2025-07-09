import ExpoModulesCore

enum PrintOrientation: String {
  case portrait
  case landscape
}

internal struct PrintOptions: Record {
  @Field
  var html: String?

  @Field
  var printerUrl: String?

  @Field
  var uri: String?

  @Field
  var width: Float?

  @Field
  var height: Float?

  @Field
  var orientation: String?

  @Field
  var margins: [String: Float]?

  @Field
  var base64: Bool = false

  @Field
  var format: String?

  @Field
  var useMarkupFormatter: Bool = false

  @Field
  var markupFormatterIOS: String?

  let kLetterPaperSize = CGSize(width: 612, height: 792)

  func toPageSize() -> CGSize {
    // defaults to pixel size for A4 paper format with 72 PPI
    var paperSize = CGSize(width: kLetterPaperSize.width, height: kLetterPaperSize.height)
    if let width = width {
      paperSize.width = CGFloat(width)
    }

    if let height = height {
      paperSize.height = CGFloat(height)
    }

    if let orientation = self.orientation, orientation == "landscape" && paperSize.height > paperSize.width {
      paperSize = CGSize(width: paperSize.height, height: paperSize.width)
    }
    return paperSize
  }

  func toPageMargins() -> UIEdgeInsets {
    var pageMargins = UIEdgeInsets.zero

    if let margins = self.margins {
      pageMargins.left = CGFloat(margins["left"] ?? 0)
      pageMargins.right = CGFloat(margins["right"] ?? 0)
      pageMargins.top = CGFloat(margins["top"] ?? 0)
      pageMargins.bottom = CGFloat(margins["bottom"] ?? 0)
    }
    return pageMargins
  }

  func toPrintableRect() -> CGRect {
    let pageSize = toPageSize()
    let pageMargins = toPageMargins()
    let printableRect = CGRect(
      x: pageMargins.left,
      y: pageMargins.top,
      width: pageSize.width - pageMargins.right - pageMargins.left,
      height: pageSize.height - pageMargins.top - pageMargins.bottom
    )

    return printableRect
  }

  func toUIPrintInfoOrientation() -> UIPrintInfo.Orientation {
    orientation == PrintOrientation.landscape.rawValue ? UIPrintInfo.Orientation.landscape : UIPrintInfo.Orientation.portrait
  }
}
