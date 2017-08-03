// Replaces a versioned URL/file slug such as `versions/v19.0.0/sdk/map-view` with `versions/{replaceWith}/sdk/map-view`
exports.replaceVersionInUrl = (url, replaceWith) => {
  let urlArr = url.split('/');
  urlArr[2] = replaceWith;
  return urlArr.join('/');
};

// Given `versions/v19.0.0/sdk/map-view`, would return `v19.0.0`
exports.getVersionFromUrl = url => {
  return url.split('/')[2];
};

exports.LATEST_VERSION = 'v' + require('../../../package.json').version;
