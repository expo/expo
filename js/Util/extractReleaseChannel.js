const url = require('url');

export default function extractReleaseChannel(manifestUrl) {
  let parsedUrl = url.parse(manifestUrl, true);
  let releaseChannel = parsedUrl.query && parsedUrl.query['release-channel'];
  if (!releaseChannel) {
    return 'default';
  } else {
    return releaseChannel;
  }
}
