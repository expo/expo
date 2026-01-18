import WidgetKit

func parseTimeline(identifier: String, name: String, family: WidgetFamily) -> [WidgetsTimelineEntry]? {
  var json = WidgetsStorage.getString(forKey: "__expo_widgets_\(name)") ?? ""
  let props = WidgetsStorage.getDictionary(forKey: "__expo_widgets_\(name)_props") ?? [:]

  // Inject props
  for (key, value) in props {
    let placeholder = "{{\(key)}}"
    if let stringValue = value as? String {
      json = json.replacingOccurrences(of: placeholder, with: stringValue)
    } else if let numberValue = value as? NSNumber {
      json = json.replacingOccurrences(of: placeholder, with: numberValue.stringValue)
    }
  }
  
  let data = try? JSONSerialization.jsonObject(with: json.data(using: .utf8)!) as? [String: Any]
  let dataForFamily = data?[getKeyFor(widgetFamily: family)] as? [[String: Any]]
  
  return dataForFamily?.map {
    WidgetsTimelineEntry(date: Date(timeIntervalSince1970: Double($0["timestamp"] as? Int ?? 0) / 1000.0), source: name, node: $0["content"] as? [String: Any])
  }
}

func getLiveActivityNodes(forName name: String) -> [String: Any]? {
  let data = WidgetsStorage.getData(forKey: "__expo_widgets_live_activity_\(name)")
  let decompressedData = try? data?.brotliDecompressed() ?? Data()
  return try? JSONSerialization.jsonObject(with: decompressedData!) as? [String: Any]
}

func getLiveActivityUrl(forName name: String) -> URL? {
  let data = WidgetsStorage.getData(forKey: "__expo_widgets_live_activity_\(name)_url")
  if let data, let url = String(data: data, encoding: .utf8) {
    return URL(string: url)
  }
  return nil
}
