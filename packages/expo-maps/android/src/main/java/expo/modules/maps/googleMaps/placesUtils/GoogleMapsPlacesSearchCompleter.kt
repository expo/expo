package expo.modules.maps.googleMaps.placesUtils

import com.google.android.gms.maps.GoogleMap
import com.google.android.libraries.places.api.model.AutocompletePrediction
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.RectangularBounds
import com.google.android.libraries.places.api.model.TypeFilter
import com.google.android.libraries.places.api.net.*
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException

class GoogleMapsPlacesSearchCompleter(
  private val placesClient: PlacesClient,
  private val tokenUtils: GoogleMapsPlacesTokenUtils,
  private val map: GoogleMap
) {

  private var searchCompleterResults = listOf<AutocompletePrediction>()

  fun autoComplete(searchQueryFragment: String, searchCompletionsPromise: Promise) {
    val request = buildAutocompleteRequest(searchQueryFragment)
    placesClient.findAutocompletePredictions(request)
      .addOnSuccessListener { response ->
        searchCompleterResults = response.autocompletePredictions
        resolveSearchCompletionsPromise(searchCompletionsPromise)
      }
      .addOnFailureListener { exception ->
        val errorMessage = "Fetching AutocompletePredictions error, ${exception.message}"
        searchCompletionsPromise.reject(SearchCompleterException(errorMessage))
      }
  }

  private fun buildAutocompleteRequest(query: String): FindAutocompletePredictionsRequest {
    return FindAutocompletePredictionsRequest.builder()
      .setLocationBias(getSearchCompletionRegion())
      .setTypeFilter(TypeFilter.ESTABLISHMENT)
      .setSessionToken(getToken())
      .setQuery(query)
      .build()
  }

  private fun getSearchCompletionRegion(): RectangularBounds {
    val visibleRegion = map.projection.visibleRegion.latLngBounds
    return RectangularBounds.newInstance(visibleRegion.southwest, visibleRegion.northeast)
  }

  private fun getToken(): AutocompleteSessionToken? {
    return tokenUtils.getToken()
  }

  private fun resolveSearchCompletionsPromise(searchCompletionsPromise: Promise) {
    val results = mapSearchCompletions(searchCompleterResults)
    searchCompletionsPromise.resolve(results)
  }

  private fun mapSearchCompletions(completions: List<AutocompletePrediction>) =
    completions.map { "${it.getFullText(null)};${it.placeId}" }
}

private class SearchCompleterException(detailMessage: String) : CodedException(detailMessage)
