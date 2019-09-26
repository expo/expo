# Google APIs Client Library for Objective-C for REST #

**Project site** <https://github.com/google/google-api-objectivec-client-for-rest><br>
**Discussion group** <http://groups.google.com/group/google-api-objectivec-client>

[![Build Status](https://travis-ci.org/google/google-api-objectivec-client-for-rest.svg?branch=master)](https://travis-ci.org/google/google-api-objectivec-client-for-rest)

Written by Google, this library is a flexible and efficient Objective-C
framework for accessing JSON APIs.

This is the recommended library for accessing JSON-based Google APIs for iOS and
Mac OS X applications.  The library is compatible with applications built for
iOS 7 and later, and Mac OS X 10.9 and later.

**To get started** with Google APIs and the Objective-C client library, Read the
[wiki](https://github.com/google/google-api-objectivec-client-for-rest/wiki).
See
[BuildingTheLibrary](https://github.com/google/google-api-objectivec-client-for-rest/wiki/BuildingTheLibrary)
for how to add the library to a Mac or iPhone application project, it covers
directly adding sources or using CocoaPods. Study the
[example applications](https://github.com/google/google-api-objectivec-client-for-rest/tree/master/Examples).

Generated interfaces for Google APIs are in the
[GeneratedServices folder](https://github.com/google/google-api-objectivec-client-for-rest/tree/master/Source/GeneratedServices).

In addition to the pre generated classes included with the library, you can
generate your own source for other services that have a
[discovery document](https://developers.google.com/discovery/v1/reference/apis#resource-representations)
by using the
[ServiceGenerator](https://github.com/google/google-api-objectivec-client-for-rest/wiki/ServiceGenerator).

**If you have a problem** or want a new feature to be included in the library,
please join the
[discussion group](http://groups.google.com/group/google-api-objectivec-client).
Be sure to include
[http logs](https://github.com/google/google-api-objectivec-client-for-rest/wiki#logging-http-server-traffic)
for requests and responses when posting questions. Bugs may also be submitted
on the [issues list](https://github.com/google/google-api-objectivec-client-for-rest/issues).

**Externally-included projects**: The library is built on top of code from the separate
project [GTM Session Fetcher](https://github.com/google/gtm-session-fetcher). To work
with some remote services, it also needs
[Authentication/Authorization](https://github.com/google/google-api-objectivec-client-for-rest/wiki#authentication-and-authorization).

**Google Data APIs**: The much older library for XML-based APIs is
[still available](https://github.com/google/gdata-objectivec-client).

Other useful classes for Mac and iOS developers are available in the
[Google Toolbox for Mac](https://github.com/google/google-toolbox-for-mac).
