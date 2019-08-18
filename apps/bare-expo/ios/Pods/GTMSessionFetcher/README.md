# Google Toolbox for Mac - Session Fetcher #

**Project site** <https://github.com/google/gtm-session-fetcher><br>
**Discussion group** <http://groups.google.com/group/google-toolbox-for-mac>

[![Build Status](https://travis-ci.org/google/gtm-session-fetcher.svg?branch=master)](https://travis-ci.org/google/gtm-session-fetcher)

`GTMSessionFetcher` makes it easy for Cocoa applications to perform http
operations. The fetcher is implemented as a wrapper on `NSURLSession`, so its
behavior is asynchronous and uses operating-system settings on iOS and Mac OS X.

Features include:
- Simple to build; only one source/header file pair is required
- Simple to use: takes just two lines of code to fetch a request
- Supports upload and download sessions
- Flexible cookie storage
- Automatic retry on errors, with exponential backoff
- Support for generating multipart MIME upload streams
- Easy, convenient logging of http requests and responses
- Supports plug-in authentication such as with GTMAppAuth
- Easily testable; self-mocking
- Automatic rate limiting when created by the `GTMSessionFetcherService` factory class
- Fully independent of other projects
