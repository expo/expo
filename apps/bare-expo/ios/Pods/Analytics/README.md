# Analytics
[![Circle CI](https://circleci.com/gh/segmentio/analytics-ios.svg?style=shield&circle-token=31c5b3e5edeb404b30141ead9dcef3eb37d16d4d)](https://circleci.com/gh/segmentio/analytics-ios)
[![Version](https://img.shields.io/cocoapods/v/Analytics.svg?style=flat)](https://cocoapods.org//pods/Analytics)
[![License](https://img.shields.io/cocoapods/l/Analytics.svg?style=flat)](http://cocoapods.org/pods/Analytics)
[![codecov](https://codecov.io/gh/segmentio/analytics-ios/branch/master/graph/badge.svg)](https://codecov.io/gh/segmentio/analytics-ios)

analytics-ios is an iOS client for Segment.

Special thanks to [Tony Xiao](https://github.com/tonyxiao), [Lee Hasiuk](https://github.com/lhasiuk) and [Cristian Bica](https://github.com/cristianbica) for their contributions to the library!

<div align="center">
  <img src="https://user-images.githubusercontent.com/16131737/53752615-e66b8000-3e63-11e9-98f6-f478c7076537.png"/>
  <p><b><i>You can't fix what you can't measure</i></b></p>
</div>

Analytics helps you measure your users, product, and business. It unlocks insights into your app's funnel, core business metrics, and whether you have product-market fit.

## How to get started
1. **Collect analytics data** from your app(s).
    - The top 200 Segment companies collect data from 5+ source types (web, mobile, server, CRM, etc.).
2. **Send the data to analytics tools** (for example, Google Analytics, Amplitude, Mixpanel).
    - Over 250+ Segment companies send data to eight categories of destinations such as analytics tools, warehouses, email marketing and remarketing systems, session recording, and more.
3. **Explore your data** by creating metrics (for example, new signups, retention cohorts, and revenue generation).
    - The best Segment companies use retention cohorts to measure product market fit. Netflix has 70% paid retention after 12 months, 30% after 7 years.

[Segment](https://segment.com) collects analytics data and allows you to send it to more than 250 apps (such as Google Analytics, Mixpanel, Optimizely, Facebook Ads, Slack, Sentry) just by flipping a switch. You only need one Segment code snippet, and you can turn integrations on and off at will, with no additional code. [Sign up with Segment today](https://app.segment.com/signup).

### Why?
1. **Power all your analytics apps with the same data**. Instead of writing code to integrate all of your tools individually, send data to Segment, once.

2. **Install tracking for the last time**. We're the last integration you'll ever need to write. You only need to instrument Segment once. Reduce all of your tracking code and advertising tags into a single set of API calls.

3. **Send data from anywhere**. Send Segment data from any device, and we'll transform and send it on to any tool.

4. **Query your data in SQL**. Slice, dice, and analyze your data in detail with Segment SQL. We'll transform and load your customer behavioral data directly from your apps into Amazon Redshift, Google BigQuery, or Postgres. Save weeks of engineering time by not having to invent your own data warehouse and ETL pipeline.

    For example, you can capture data on any app:
    ```js
    analytics.track('Order Completed', { price: 99.84 })
    ```
    Then, query the resulting data in SQL:
    ```sql
    select * from app.order_completed
    order by price desc
    ```

### 🚀 Startup Program
<div align="center">
  <a href="https://segment.com/startups"><img src="https://user-images.githubusercontent.com/16131737/53128952-08d3d400-351b-11e9-9730-7da35adda781.png" /></a>
</div>
If you are part of a new startup  (&lt;$5M raised, &lt;2 years since founding), we just launched a new startup program for you. You can get a Segment Team plan  (up to <b>$25,000 value</b> in Segment credits) for free up to 2 years — <a href="https://segment.com/startups/">apply here</a>!

## Installation

Analytics is available through [CocoaPods](http://cocoapods.org) and [Carthage](https://github.com/Carthage/Carthage).

### CocoaPods

```ruby
pod "Analytics", "3.7.0"
```

### Carthage

```
github "segmentio/analytics-ios"
```

## Quickstart

Refer to the Quickstart documentation at [https://segment.com/docs/libraries/ios/quickstart](https://segment.com/docs/libraries/ios/quickstart/).

## Documentation

More detailed documentation is available at [https://segment.com/docs/libraries/ios](https://segment.com/docs/libraries/ios/).
