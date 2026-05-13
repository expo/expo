/// <reference types="node" />

/** @jest-environment node */

import { FetchResponse } from '../FetchResponse';

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {}
  class StubNativeRequest {}
  return {
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
    },
  };
});

describe('FetchResponse', () => {
  it('identifies as a standard Response via Symbol.toStringTag', () => {
    expect(Object.prototype.toString.call(FetchResponse.prototype)).toBe('[object Response]');
  });
});
