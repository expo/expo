'use strict';

jest.mock('../cli', () => ({ prebuiltMetadata: jest.fn() }));

const { prebuiltMetadata } = require('../cli');
const { readPrebuiltMetadata } = require('../metadata');
const { thrownBy } = require('./helpers');

const read = (document) => {
  prebuiltMetadata.mockReturnValue(document);
  return readPrebuiltMetadata('/app');
};

describe('readPrebuiltMetadata', () => {
  it('asks the autolinking CLI for the document from the app root', () => {
    read({});

    expect(prebuiltMetadata).toHaveBeenLastCalledWith('/app');
  });

  it('fills in every field an entry leaves out', () => {
    expect(read({ ExpoAsset: {} }).get('ExpoAsset')).toEqual({
      podName: 'ExpoAsset',
      packageRoot: null,
      productName: 'ExpoAsset',
      sourceOnly: false,
      iosDeploymentTarget: null,
      spmPackages: [],
      autolinkWhen: null,
    });
  });

  it('keeps every field it reads, and nothing else', () => {
    const spmPackages = [
      {
        url: 'https://github.com/SDWebImage/SDWebImage.git',
        productName: 'SDWebImage',
        version: { exact: '5.21.6' },
      },
    ];
    const autolinkWhen = { podfileProperty: 'expo.image.enabled', disabledValue: false };

    expect(
      read({
        ExpoImage: {
          type: 'internal',
          npmPackage: 'expo-image',
          packageRoot: '/app/node_modules/expo-image',
          podspecDir: '/app/node_modules/expo-image/ios',
          productName: 'ExpoImageProduct',
          sourceOnly: true,
          iosDeploymentTarget: '16.4',
          spmPackages,
          autolinkWhen,
        },
      }).get('ExpoImage')
    ).toEqual({
      podName: 'ExpoImage',
      packageRoot: '/app/node_modules/expo-image',
      productName: 'ExpoImageProduct',
      sourceOnly: true,
      iosDeploymentTarget: '16.4',
      spmPackages,
      autolinkWhen,
    });
  });

  const spmPackage = (fields) => ({
    spmPackages: [
      {
        url: 'https://github.com/SDWebImage/SDWebImage.git',
        productName: 'SDWebImage',
        version: { exact: '5.21.6' },
        ...fields,
      },
    ],
  });

  it.each([
    ['packageRoot', { packageRoot: 17 }],
    ['productName', { productName: '' }],
    ['sourceOnly', { sourceOnly: 'true' }],
    ['iosDeploymentTarget', { iosDeploymentTarget: 16.4 }],
    ['spmPackages', { spmPackages: { SDWebImage: '5.21.6' } }],
    ['spmPackages[0]', { spmPackages: ['SDWebImage'] }],
    ['spmPackages[0].url', spmPackage({ url: undefined })],
    ['spmPackages[0].url', spmPackage({ url: '' })],
    ['spmPackages[0].productName', spmPackage({ productName: 7 })],
    ['spmPackages[0].version', spmPackage({ version: undefined })],
    ['spmPackages[0].version', spmPackage({ version: { exact: 5 } })],
    ['spmPackages[0].version', spmPackage({ version: { exact: '1.0.0', branch: 'main' } })],
    ['spmPackages[0].version', spmPackage({ version: { tag: '1.0.0' } })],
    ['autolinkWhen', { autolinkWhen: 'ExpoCamera' }],
    ['autolinkWhen.podName', { autolinkWhen: { podName: 42 } }],
  ])('refuses an entry whose %s is malformed, naming the pod and the field', (field, entry) => {
    const error = thrownBy(() => read({ ExpoImage: entry }));

    expect(error).not.toBeInstanceOf(TypeError);
    expect(error?.message).toMatch(/^\[expo-spm-plugin\] /);
    expect(error?.message).toContain(`entry for pod ExpoImage has an unusable ${field}:`);
  });

  it('refuses an entry that is not an object', () => {
    expect(() => read({ ExpoImage: 'ExpoImage' })).toThrow(
      'entry for pod ExpoImage is not an object'
    );
  });

  it('refuses a document that is not an object keyed by pod name', () => {
    expect(() => read([])).toThrow('is not an object keyed by pod name');
  });

  it('says why the entry matters and what to do about it', () => {
    const { message } = thrownBy(() => read({ ExpoImage: spmPackage({ version: undefined }) }));

    expect(message).toContain('expected exactly one of exact, from, branch or revision');
    expect(message).toContain('expo-modules-autolinking prebuilt-metadata --json');
    expect(message).toContain('Reinstall your JavaScript dependencies');
  });
});
