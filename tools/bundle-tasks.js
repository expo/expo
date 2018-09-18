'use strict';

const assert = require('assert');
const FormData = require('form-data');
const fs = require('fs-extra');
const got = require('got');
const nullthrows = require('nullthrows').default;
const process = require('process');
const url = require('url');
const crayon = require('@ccheever/crayon');

const projectVersions = require('../tools-public/project-versions');

let argv = require('minimist')(process.argv.slice(2));

exports.saveKernelBundlesAsync = async function saveKernelBundlesAsync() {
  if (!argv.all && !argv.ios && !argv.android) {
    crayon.red.error('Must specify --all, --ios, or --android');
    return;
  }

  try {
    let bundleSaver = new BundleSaver('/exponent.bundle');
    let result = await bundleSaver.saveBundlesAsync({
      ios: argv.all || argv.ios,
      android: argv.all || argv.android,
      verbose: true,
      upload: !argv.noUpload,
    });
    console.log(result);
  } catch (e) {
    crayon.red.error(e);
    throw e;
  }
};

class BundleSaver {
  constructor(bundlePath) {
    this.bundlePath = bundlePath;
  }

  async saveBundlesAsync(options = {}) {
    let promises = [];
    if (options.ios) {
      promises.push(this._saveBundleAsync(options, 'ios'));
    }
    if (options.android) {
      promises.push(this._saveBundleAsync(options, 'android'));
    }

    let results = await Promise.all(promises);
    return results;
  }

  async _saveBundleAsync(options, platform) {
    let [bundle, versions] = await Promise.all([
      this._fetchBundleAsync(platform, options),
      projectVersions.getProjectVersionsAsync(),
    ]);

    let embeddedBundleFilename =
      platform === 'android'
        ? '../android/app/src/main/assets/kernel.android.bundle'
        : '../ios/Exponent/Supporting/kernel.ios.bundle';

    // Embed bundle in app
    await fs.writeFile(embeddedBundleFilename, bundle);

    if (options.upload) {
      let form = new FormData();
      form.append('bundle', bundle, {
        filename: `exponent.${platform}.bundle.js`,
      });

      // this comes from update-local-secrets
      let adminToken = require('./.admin-token.json').token;

      let response = await got.put('https://exp.host/--/upload-kernel', {
        query: {
          adminToken: adminToken,
          platform,
          sdkVersion: versions.sdkVersion,
        },
        headers: form.getHeaders(),
        body: form,
        timeout: 20000,
      });
      return { bundle: `${bundle.substr(0, 48)}...`, url: response.body };
    } else {
      console.log(
        'Not uploading bundle. Remember to run this again later without --noUpload to upload the latest bundle.'
      );
      return { bundle: `${bundle.substr(0, 48)}...` };
    }
  }

  async _fetchBundleAsync(platform, options) {
    let urlObject = {
      protocol: 'http:',
      slashes: true,
      hostname: 'localhost',
      port: 8081,
      pathname: this.bundlePath,
      query: {
        platform,
        dev: 'false',
        minify: 'true',
      },
    };
    let urlString = url.format(urlObject);

    if (options.verbose) {
      console.log(`Fetching Exponent bundle for ${platform} from ${urlString}`);
    }
    let response = await got(urlString, { timeout: 30000 });
    let bundleSource = response.body;
    if (options.verbose) {
      console.log(
        `Finished fetching Exponent bundle for ${platform} ` +
          `(${bundleSource.length} bytes)`
      );
    }
    return bundleSource;
  }
}
