import MapKit

class AppleMapsPOISearchResultsView: UITableViewController {
  var searchCompleterResults: [MKLocalSearchCompletion]?
  var mapView: MKMapView?
  private var appleMapsPOISearchCompleter: AppleMapsPOISearchCompleter?

  override func viewDidLoad() {
    super.viewDidLoad()
    tableView.register(PlacesSearchTableViewCell.self, forCellReuseIdentifier: PlacesSearchTableViewCell.reuseID)
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    if appleMapsPOISearchCompleter == nil {
      appleMapsPOISearchCompleter = AppleMapsPOISearchCompleter(delegate: self)
    }
    if let mapView = mapView {
      appleMapsPOISearchCompleter?.setSearchCompleterRegion(region: mapView.region)
    }
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    appleMapsPOISearchCompleter = nil
  }

  override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return searchCompleterResults?.count ?? 0
  }

  override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: PlacesSearchTableViewCell.reuseID, for: indexPath)

    if let suggestion = searchCompleterResults?[indexPath.row] {
      cell.textLabel?.attributedText = createHighlightedString(text: suggestion.title, rangeValues: suggestion.titleHighlightRanges)
      cell.detailTextLabel?.attributedText = createHighlightedString(text: suggestion.subtitle, rangeValues: suggestion.subtitleHighlightRanges)
    }
    return cell
  }

  private func createHighlightedString(text: String, rangeValues: [NSValue]) -> NSAttributedString {
    let attributes = [NSAttributedString.Key.backgroundColor: UIColor.lightGray]
    let highlightedString = NSMutableAttributedString(string: text)
    let ranges = rangeValues.map { $0.rangeValue }
    ranges.forEach { range in
      highlightedString.addAttributes(attributes, range: range)
    }
    return highlightedString
  }
}

extension AppleMapsPOISearchResultsView: UISearchResultsUpdating {
  func updateSearchResults(for searchController: UISearchController) {
    appleMapsPOISearchCompleter?.autoComplete(searchQueryFragment: searchController.searchBar.text ?? "")
  }
}

extension AppleMapsPOISearchResultsView: MKLocalSearchCompleterDelegate {
  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    searchCompleterResults = completer.results
    tableView?.reloadData()
  }
}

private class PlacesSearchTableViewCell: UITableViewCell {
  static let reuseID = "PlacesSearchTableViewCellReuseID"
  override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
    super.init(style: .subtitle, reuseIdentifier: reuseIdentifier)
  }
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
