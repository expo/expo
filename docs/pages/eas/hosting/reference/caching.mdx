---
sidebar_title: Caching
title: Caching with EAS Hosting deployments
description: Learn how caching works on EAS Hosting.
---

## Caching with API Routes

API routes can return `Cache-Control` directives that will be used by EAS Hosting to cache the response appropriately according to the value of cache directives.

```js
export async function GET(request) {
  return Response.json({ ... }, {
    headers: {
	    'Cache-Control': 'public, max-age=3600'
    },
  });
}
```

`Cache-Control` directives present in the response will be used by EAS Hosting to cache the response as specified. For example, if the `Response` specifies a cache directive with `max-age` set to 1800 seconds, the response will be cached for the specified amount of time before the API route is invoked again.

For more details about `Cache-Control` directives, refer to the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control).

## Cache-Control directives

`Cache-Control` headers may be sent as part of a request's and a response's headers and are a string of comma-separated settings.

When a request sends a `Cache-Control` header, it typically sends directives that constrain how a cached response may be delivered. If it's sent as a response header, it specifies to EAS Hosting how a response will be cached and how often it will be revalidated by re-invoking an API route.

If a cache directive accepts a parameter, the directive is followed by an equal sign and the parameter's value, for example, `max-age=3600`. If the directive does not accept a parameter, it's listed without a value, for example, `public`.

If multiple cache directives are passed, each is separated from the last by a comma, for example, `public, max-age=3600`.

## Cacheability

Several response directives determine whether a cached response may be cached or returned to a client:

- `public` — Indicates any cache (including EAS Hosting) may store the response. Without it, it's implied that the response is not shared between multiple requests.
- `private` — Indicates the response is intended for a single user and may only be cached by a browser.
- `no-store` or `no-cache` — Indicates that this response may never be cached or stored.

For example, specifying `public, max-age=3600` specifies that EAS Hosting is (additionally to a user's browser) allowed to store the response for 3600 seconds. However, `private, max-age=3600` means only the user's browser may store the response for 3600 seconds, while EAS Hosting will not cache it.

Responses to requests with no `Authorization` header set and are either for the `HEAD` or `GET` request methods are automatically considered publicly cacheable.

To differentiate between what a browser and EAS Hosting may cache, the `s-maxage` directive may be used. For example, responding with the `s-maxage=3600` directive will allow EAS Hosting to cache the response for 3600 seconds, while the user's browser won't cache it at all.

## Header names

As seen above, the Cache-Control header is accepted and understood both by browsers and EAS Hosting. To customize caching for EAS Hosting more granularly, and separately from the user's browser, you can respond with a CDN-Cache-Control header. When this header is used, it implicitly adds public to your directives and forces EAS Hosting to cache the response according to your directives.

```js
export async function GET(request) {
  return Response.json({ ... }, {
    headers: {
	    'Cache-Control': 'no-store', // browsers should never store the response
	    'CDN-Cache-Control': 'max-age=3600', // EAS Hosting should cache for 3600s
    },
  });
}
```

## Expiration directives

- `max-age` is used to specify how long a response is cached until it's considered stale
- `s-maxage` is used to indicate only to EAS Hosting how long it should cache a response
- `no-cache` is equivalent to specifying a max-age of zero
- `immutable` is used to indicate that the response is indefinitely cacheable and should be cached for as long as possible and is never considered stale.

Additionally, two newer cache control directives can be used to determine how stale responses may be used for longer than the `max-age` specified for them.

- `stale-while-revalidate` specifies a stale time period for a response. After a cached response is considered stale, it allows the response to still be returned to clients for the specified timeframe, while re-validating the request in the background.
  - For example, `max-age=1800, stale-while-revalidate=3600` specifies that the response is cached for 1800 seconds. After 1800 seconds, if a new request is made for this response, it is returned if the request is made within 3600 seconds, but the request will also be sent onwards to your API route in the background.
- `stale-if-error` specifies a stale time period for a response to be returned if the underlying API route fails unexpectedly. This is useful to make an API route fault-tolerant and applies when your API route crashes with a runtime error or returns a `500`, `502`, `503` or `504` response status.
  - For example, `max-age=1800, stale-if-error=3600` specifies that the response is cached for 1800 seconds. After 1800 seconds, if your API route responds with an error, the stale cached response is sent to clients instead of the error.

## Request directives

`Cache-Control` headers can be sent as part of a request's headers and will affect how EAS Hosting chooses to return cached responses.

- `only-if-cached` will only return a response if it's cached, and otherwise abort the request with a `504` response (with a `must-revalidate` directive)
- `no-store`, `no-cache`, or `max-age=0` will skip cached responses and always force EAS Hosting to ignore its request cache
- `min-fresh` will skip a cached response if it's older than the specified value. For example, `min-fresh=360` will prevent a cached response from being returned if it's been cached for longer than 360 seconds.

Additionally, `max-stale` and `stale-if-error` may be sent as part of the request's cache directive and limit the stale time of cached responses. However, remember that this doesn't override how long a request is cached, so this may only be used to **reduce** the amount of acceptable staleness of a cached response.

- `max-stale` specifies a maximum time that is acceptable for a client to accept a cached response. For example, if a response was cached using the `stale-while-revalidate=3600` directive, a request may specify `max-stale=1800` to instead only accept a stale response with a maximum age of 1800 seconds (in its stale period, not `max-age`)
- `stale-if-error` may be used to customize the period for which stale responses are accepted if the API route would otherwise respond with an error.

For both directives, if the server-side response was cached for a shorter amount of time than the specified `max-stale` or `stale-if-error` periods on top of the response's `max-age`, then these directives will do nothing.

## Request methods

In addition to caching `GET` and `HEAD` requests, EAS Hosting also supports caching `POST` requests.

Provided a `POST` request with a request body smaller than 1MB is sent, your response may specify a `Cache-Control` header with the `public` directive to mark the request as cacheable.

## The `Expires` header

EAS Hosting also supports caching using the older [`Expires` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires).

As this won't mark the response as publicly cacheable, it's typically only used for unauthenticated `GET` responses. It may specify an HTTP Date value until a response is cached. After the specified timestamp, the response is considered stale.

## The `Vary` header

By default:

- a `GET` or `HEAD` request is only cached by its URL
- a `POST` request is only cached by its URL and request body

However, you can use the `Vary` header to specify that the request should be using request headers as a cache key. For example, if an API route responds with `Vary: custom-header` , then the cached response will only be used if the request's `custom-header` header value matches the cached request's `custom-header` value.

## CORS caching

For many web requests, the browser will make CORS requests with the `OPTIONS` method to determine access control settings for a route.

These requests are cacheable using the special `Access-Control-Max-Age` header. For example, `Access-Control-Max-Age: 3600` will cache the `OPTIONS` response for 3600 seconds, which applies to both browsers and the EAS Hosting cache. This prevents excessive requests made by browsers and prevents your API route from being called excessively often for CORS requests.

## Asset Caching

For any assets your deployment responds with, a default cache time of 3600 seconds will be applied for browser caches. To improve performance, per-deployment assets are cached indefinitely internally. Since deployments are immutable, this doesn't affect you.

EAS Hosting will ignore its cached assets when you assign a new deployment to an alias. For example, when you promote a new deployment to production, the cache will be ignored and your asset responses should switch over to your new deployment instantly.

## Billing and metrics

EAS Hosting bills per request (in units of 1M requests). However, cached requests **still count** against your quota and you will be charged for requests, even if they are cached by EAS Hosting.

Metrics are not affected by caching. Cached requests will be logged like any other request, and the metrics in the EAS dashboard will also reflect and represent cached requests.
