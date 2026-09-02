import ExpoModulesCore
import VisionKit
import PDFKit

internal final class DocumentScannerDelegate: NSObject, VNDocumentCameraViewControllerDelegate {
  private weak var appContext: AppContext?
  private let options: DocumentScannerOptions
  private var continuation: CheckedContinuation<[String: Any]?, Error>?

  init(appContext: AppContext?, options: DocumentScannerOptions, continuation: CheckedContinuation<[String: Any]?, Error>) {
    self.appContext = appContext
    self.options = options
    self.continuation = continuation
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFinishWith scan: VNDocumentCameraScan
  ) {
    let quality = CGFloat(max(0.0, min(1.0, options.quality)))
    let images = (0..<scan.pageCount).map {
      scan.imageOfPage(at: $0)
    }

    DispatchQueue.global(qos: .userInitiated).async {
      var pageUris: [String] = []

      for (index, image) in images.enumerated() {
        guard let data = image.jpegData(compressionQuality: quality) else {
          return self.finish(controller, with: .failure(DocumentScanFailedException("could not encode page \(index)")))
        }
        let path = FileSystemUtilities.generatePathInCache(self.appContext, in: "DocumentScanner", extension: ".jpg")
        do {
          try data.write(to: URL(fileURLWithPath: path))
          pageUris.append(URL(fileURLWithPath: path).absoluteString)
        } catch {
          return self.finish(controller, with: .failure(DocumentScanFailedException("could not save page \(index): \(error.localizedDescription)")))
        }
      }

      var result: [String: Any] = ["pages": pageUris]
      if self.options.requestPdf {
        do {
          result["pdfUri"] = try self.writePdf(images: images)
        } catch {
          return self.finish(controller, with: .failure(DocumentScanFailedException("could not generate PDF: \(error.localizedDescription)")))
        }
      }

      self.finish(controller, with: .success(result))
    }
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    finish(controller, with: .success(nil))
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFailWithError error: Error
  ) {
    finish(controller, with: .failure(DocumentScanFailedException(error.localizedDescription)))
  }

  private func finish(_ controller: VNDocumentCameraViewController, with result: Result<[String: Any]?, Error>) {
    DispatchQueue.main.async {
      guard let continuation = self.continuation else { return }
      self.continuation = nil
      controller.dismiss(animated: true) {
        continuation.resume(with: result)
      }
    }
  }

  private func writePdf(images: [UIImage]) throws -> String {
    let path = FileSystemUtilities.generatePathInCache(appContext, in: "DocumentScanner", extension: ".pdf")
    let documentPath = URL(fileURLWithPath: path)
    let document = PDFDocument()

    for (index, image) in images.enumerated() {
      guard let page = PDFPage(image: image) else {
        throw DocumentScanFailedException("could not create PDF page \(index)")
      }
      document.insert(page, at: index)
    }

    guard document.write(to: documentPath) else {
      throw DocumentScanFailedException("could not write the PDF file")
    }
    return URL(fileURLWithPath: path).absoluteString
  }
}
