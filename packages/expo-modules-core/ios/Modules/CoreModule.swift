// The core module that describes the `global.expo` object.
internal final class CoreModule: Module {
  internal func definition() -> ModuleDefinition {
    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("uuidv4") { () -> String in
      return UUID().uuidString.lowercased()
    }

    Function("uuidv5") { (name: String, namespace: String) -> String in
      guard let namespaceUuid = UUID(uuidString: namespace) else {
        throw InvalidNamespaceException(namespace)
      }

      return uuidv5(name: name, namespace: namespaceUuid).uuidString.lowercased()
    }

    // TextEncoder API
    // https://encoding.spec.whatwg.org/#textencoder
    Class("TextEncoder") {
      // TODO: This throws:  ERROR  Error: NativePropertyUnavailableException: Native property 'encoding' 
      // is no longer available in memory (at ExpoModulesCore/PropertyComponent.swift:142)
      Property("encoding") {
        return "utf-8"
      }

      // https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto
      Function("encodeInto") { (source: String, destination: Uint8Array) -> TextEncoderEncodeIntoResult in
        let bytes = Array(source.utf8)
        let count = min(bytes.count, destination.length)
          
        for i in 0..<count {
            destination[i] = bytes[i]
        }

        return TextEncoderEncodeIntoResult(read: source.count, written: count)
      }

      Function("encode") { (input: String) -> [UInt8] in
        // TODO: Return Uint8Array directly
        return Array(input.utf8)
      }
    }
  }
}

struct TextEncoderEncodeIntoResult: Record {
  @Field
  var read: Int = 0

  @Field
  var written: Int = 0
}
