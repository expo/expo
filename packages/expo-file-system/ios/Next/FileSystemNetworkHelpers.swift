// Copyright 2025-present 650 Industries. All rights reserved.

internal func createMultipartData(file: FileSystemFile, boundary: String, options: UploadOptionsNext) throws -> Data {

  var body = Data()
  let fileName = file.url.lastPathComponent
  let contentType = options.mimeType ?? file.type ?? "application/octet-stream"

  guard let fileData = try? Data(contentsOf: file.url) else {
    throw UnableToEncodeFileException()
  }

  let multipartString = """
--\(boundary)\r
Content-Disposition: form-data; name=\"\(options.fieldName)\"; filename=\"\(fileName)\"\r
Content-Type: \(contentType)\r
\r

"""
  
  body.append(multipartString.data)
  body.append(fileData)
  body.append("\r\n--\(boundary)--\r\n".data)

  return body;
}

// All swift strings are unicode correct.
// This avoids the optional created by string.data(using: .utf8)
private extension String {
  var data: Data { Data(self.utf8) }
}
