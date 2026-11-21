// The prebuilt artifact does not include the Play services libraries.
providers.gradleProperty("expo.sensors.pedometer-play-services-enabled").getOrElse("false").toString() != "true"
