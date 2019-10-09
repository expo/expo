---
title: Advanced Release Channels
---

## Introduction

For a quick introduction to release channels, read [this](../release-channels/).

When you publish your app by running `expo publish --release-channel staging`, it creates:

- a release, identified by a `publicationId` for Android and iOS platforms. A release refers to your bundled source code and assets at the time of publication.
- a link to the release in the `staging` channel, identified by a `channelId`. This is like a commit on a git branch.

For simplicity, the rest of this article will refer to just the `ios` releases, but you could swap out ios for android at any point and everything would still be true.

## See past publishes
You can see everything that you’ve published with `expo publish:history`.

#### Example command and output
`expo publish:history --platform ios`

| publishedTime  | appVersion  | sdkVersion  | platform  | channel  | channelId  | publicationId  |
|---|---|---|---|---|---|---|
| 2018-01-05T23:55:04.603Z  |  1.0.0 | 24.0.0 |  ios | staging  | 9133d577  | d9bd6b80  |

To see more details about this particular release, you can run `expo publish:details`

#### Example command and output
`expo publish:details --publish-id d9bd6b80`

![Publish Details](/static/images/release-channels-pub-details-1.png)


## What version of the app will my users get?

Your users will get the most recent compatible release that was pushed to a channel. Factors that affect compatibility:

- sdkVersion
- platform

The following flowchart shows how we determine which release to return to a user:

![Serving Flowchart](/static/images/release-channels-flowchart.png)

## Promoting a release to a new channel

Example use case: you previously published a release to `staging` and everything went well in your testing. Now you want this release to be active in another channel (ie) production

We run `expo publish:set` to push our release to the `production` channel.
`expo publish:set --publish-id d9bd6b80 --release-channel production`

Continuing from the previous section, we can see that our release is available in both the `staging` and the `production` channels.

`expo publish:history --platform ios`

| publishedTime  | appVersion  | sdkVersion  | platform  | channel  | channelId  | publicationId  |
|---|---|---|---|---|---|---|
| 2018-01-05T23:55:04.603Z  |  1.0.0 | 24.0.0 |  ios | staging  | 9133d577  | d9bd6b80  |
| 2018-01-05T23:55:04.603Z  |  1.0.0 | 24.0.0 |  ios | production  | 6e406223  | d9bd6b80  |

## Rollback a channel entry

Example use case: you published a release to your `production` channel, only to realize that it includes a major regression for some of your users, so you want to revert back to the previous version.

Continuing from the previous section, we rollback our `production` channel entry with `expo publish:rollback`.

`expo publish:rollback --channel-id 6e406223`

Now we can see that our release is no longer available in the production channel.

`expo publish:history --platform ios`

| publishedTime  | appVersion  | sdkVersion  | platform  | channel  | channelId  | publicationId  |
|---|---|---|---|---|---|---|
| 2018-01-05T23:55:04.603Z  |  1.0.0 | 24.0.0 |  ios | staging  | 9133d577  | d9bd6b80  |

## Release channels CLI tools
### Publish history

```
  Usage: expo publish:history [--release-channel <channel-name>] [--count <number-of-logs>]

  View a log of your published releases.

  Options:
    -c, --release-channel <channel-name>  Filter by release channel. If this flag is not included, the most recent publications will be shown.
    -count, --count <number-of-logs>      Number of logs to view, maximum 100, default 5.
    -r, --raw                             Produce some raw output.
    -p, --platform <ios|android>          Filter by platform, android or ios.
```

### Publish details
```
  Usage: expo publish:details --publish-id <publish-id>
  View the details of a published release.

  Options:
    --publish-id <publish-id>  Publication id. (Required)
    -r, --raw                             Produce some raw output.
```

### Publish rollback
```
Usage: expo publish:rollback --channel-id <channel-id>

  Rollback an update to a channel.

  Options:
    --channel-id <channel-id>  The channel id to rollback in the channel. (Required)
```

### Publish set
```
 Usage: expo publish:set --release-channel <channel-name> --publish-id <publish-id>

  Set a published release to be served from a specified channel.

  Options:
    -c, --release-channel <channel-name>  The channel to set the published release. (Required)
    -p, --publish-id <publish-id>         The id of the published release to serve from the channel. (Required)
```
