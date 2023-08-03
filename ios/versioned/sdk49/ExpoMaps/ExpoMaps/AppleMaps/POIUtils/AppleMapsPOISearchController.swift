import MapKit

class AppleMapsPOISearchController: NSObject {
  private var navigationBar: UINavigationBar
  private var navigationItem: UINavigationItem
  private var searchController: UISearchController?
  private let poiSearchService: AppleMapsPOISearch
  private var searchResultsTable: AppleMapsPOISearchResultsView?

  init(searchService: AppleMapsPOISearch) {
    poiSearchService = searchService

    navigationBar = UINavigationBar(frame: CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: 100))
    navigationItem = UINavigationItem()
    navigationItem.hidesSearchBarWhenScrolling = false
    navigationItem.title = "Search:"
    navigationBar.setItems([navigationItem], animated: false)
  }

  func enablePOISearchController(mapView: MKMapView) {
    mapView.addSubview(navigationBar)
    let poiSearchResultsView = AppleMapsPOISearchResultsView(style: .grouped)
    searchResultsTable = poiSearchResultsView
    searchResultsTable?.tableView.delegate = self
    searchResultsTable?.mapView = mapView
    searchResultsTable?.definesPresentationContext = false
    setSearchController(mapView)
  }

  private func setSearchController(_ mapView: MKMapView) {
    let sC = UISearchController(searchResultsController: searchResultsTable)
    searchController = sC
    searchController?.searchResultsUpdater = searchResultsTable
    setSearchBar()
    navigationItem.searchController = searchController
    mapView.addSubview(sC.view)
  }

  func disablePOISearchController() {
    navigationBar.removeFromSuperview()
  }

  private func setSearchBar() {
    let searchBar = searchController?.searchBar
    searchBar?.sizeToFit()
    searchBar?.placeholder = "Search for points of interst..."
    searchBar?.delegate = self
  }
}

// table view delegate
extension AppleMapsPOISearchController: UITableViewDelegate {
  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    tableView.deselectRow(at: indexPath, animated: true)
    if let suggestion =
      searchResultsTable?.searchCompleterResults?[indexPath.row] {
      searchController?.isActive = false
      searchController?.searchBar.text = suggestion.title
      poiSearchService.createSearchRequest(for: suggestion)
    }
  }
}

extension AppleMapsPOISearchController: UISearchBarDelegate {
  func searchBarTextDidBeginEditing(_ searchBar: UISearchBar) {
    searchBar.setShowsCancelButton(true, animated: true)
  }

  func searchBarTextDidEndEditing(_ searchBar: UISearchBar) {
    searchBar.setShowsCancelButton(false, animated: true)
  }

  func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
    if let text = searchBar.text {
      searchController?.isActive = false
      searchController?.searchBar.text = text
      poiSearchService.createSearchRequest(for: text)
    }
  }
}
