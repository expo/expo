'use strict';

const {
  reactPackageDependency,
  reactProductDependencies,
  reactPackageDeclarations,
} = require('../react-descriptor');

const pathRef = {
  packageRef: { name: 'ReactNative', path: '/abs/react-native' },
  products: [
    { name: 'ReactHeaders', package: 'ReactNative' },
    { name: 'ReactNativeHeaders', package: 'ReactNative' },
    { name: 'ReactNativeDependenciesHeaders', package: 'ReactNative' },
    { name: 'ReactAppHeaders', package: 'React-GeneratedCode' },
  ],
};

const urlRef = {
  packageRef: { name: 'ReactNative', url: 'https://example/rn.git', version: '0.87.0' },
  products: [{ name: 'ReactHeaders', package: 'ReactNative' }],
};

describe('reactPackageDependency', () => {
  it('renders a path ref', () => {
    expect(reactPackageDependency(pathRef)).toBe('.package(name: "ReactNative", path: "/abs/react-native")');
  });

  it('renders a url ref with exact version', () => {
    expect(reactPackageDependency(urlRef)).toBe('.package(url: "https://example/rn.git", exact: "0.87.0")');
  });
});

describe('reactProductDependencies', () => {
  it('maps exactly the invariant products supplied by RN', () => {
    expect(reactProductDependencies(pathRef)).toEqual([
      '.product(name: "ReactHeaders", package: "ReactNative")',
      '.product(name: "ReactNativeHeaders", package: "ReactNative")',
      '.product(name: "ReactNativeDependenciesHeaders", package: "ReactNative")',
      '.product(name: "ReactAppHeaders", package: "React-GeneratedCode")',
    ]);
  });
});

describe('reactPackageDeclarations', () => {
  it('declares React-GeneratedCode only when a product references it AND a codegen path exists', () => {
    expect(reactPackageDeclarations(pathRef, '/abs/app/ios')).toEqual([
      '.package(name: "ReactNative", path: "/abs/react-native")',
      '.package(name: "React-GeneratedCode", path: "/abs/app/ios")',
    ]);
  });

  it('omits React-GeneratedCode when no product references it', () => {
    expect(reactPackageDeclarations(urlRef, '/abs/app/ios')).toEqual([
      '.package(url: "https://example/rn.git", exact: "0.87.0")',
    ]);
  });

  it('omits React-GeneratedCode when the codegen path is null even if referenced', () => {
    expect(reactPackageDeclarations(pathRef, null)).toEqual([
      '.package(name: "ReactNative", path: "/abs/react-native")',
    ]);
  });
});
