// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct GeocodingResult: Record {
  @Field
  var accuracy: Double = 0
  
  @Field
  var altitude: Double = 0
  
  @Field
  var coordinates: Coordinate = Coordinate()
}

internal struct ReverseGeocodingResult: Record {
  @Field
  var city: String? = nil
  
  @Field
  var country: String? = nil
  
  @Field
  var district: String? = nil
  
  @Field
  var formattedAddress: String? = nil
  
  @Field
  var isoCountryCode: String? = nil
  
  @Field
  var name: String? = nil
  
  @Field
  var postalCode: String? = nil
  
  @Field
  var region: String? = nil
  
  @Field
  var street: String? = nil
  
  @Field
  var streetNumber: String? = nil
  
  @Field
  var subregion: String? = nil
  
  @Field
  var timezone: String? = nil
}


struct sadas {
  var test: String?
}



