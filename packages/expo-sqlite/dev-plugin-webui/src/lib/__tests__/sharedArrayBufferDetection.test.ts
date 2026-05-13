import { describe, expect, it } from '@jest/globals';

import {
  getLocalhostUrl,
  isLocalhost,
  isSharedArrayBufferSupported,
} from '../sharedArrayBufferDetection';

describe('sharedArrayBufferDetection', () => {
  describe('isLocalhost', () => {
    it('should return true for localhost addresses', () => {
      expect(isLocalhost('localhost')).toBe(true);
      expect(isLocalhost('127.0.0.1')).toBe(true);
      expect(isLocalhost('::1')).toBe(true);
    });

    it('should return false for non-localhost addresses', () => {
      expect(isLocalhost('10.0.0.1')).toBe(false);
      expect(isLocalhost('192.168.1.1')).toBe(false);
      expect(isLocalhost('172.20.10.5')).toBe(false);
      expect(isLocalhost('8.8.8.8')).toBe(false);
      expect(isLocalhost('example.com')).toBe(false);
    });
  });

  describe('getLocalhostUrl', () => {
    it('should convert current URL to localhost URL', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'http:',
          port: '8081',
          pathname: '/_expo/plugins/expo-sqlite/',
          search: '?test=1',
          hash: '#hash',
        },
      });

      const result = getLocalhostUrl();
      expect(result).toBe('http://localhost:8081/_expo/plugins/expo-sqlite/?test=1#hash');

      window.location = originalLocation;
    });

    it('should handle URLs without port', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'https:',
          port: '',
          pathname: '/path',
          search: '',
          hash: '',
        },
      });

      const result = getLocalhostUrl();
      expect(result).toBe('https://localhost/path');

      window.location = originalLocation;
    });
  });

  describe('isSharedArrayBufferSupported', () => {
    it('should detect secure context correctly', () => {
      const originalIsSecureContext = window.isSecureContext;
      const originalLocation = window.location;

      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true,
      });

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'https:',
          hostname: 'localhost',
        },
      });

      const result = isSharedArrayBufferSupported();
      expect(result.isSecureContext).toBe(true);

      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: originalIsSecureContext,
      });

      window.location = originalLocation;
    });

    it('should include current protocol in result', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'https:',
          hostname: 'localhost',
        },
      });

      const result = isSharedArrayBufferSupported();
      expect(result.currentProtocol).toBe('https:');

      window.location = originalLocation;
    });

    it('should detect non-localhost correctly', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'http:',
          hostname: '192.168.1.1',
        },
      });

      const result = isSharedArrayBufferSupported();
      expect(result.isLocalhost).toBe(false);
      expect(result.currentHost).toBe('192.168.1.1');

      window.location = originalLocation;
    });

    it('should detect localhost correctly', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'http:',
          hostname: 'localhost',
        },
      });

      const result = isSharedArrayBufferSupported();
      expect(result.isLocalhost).toBe(true);
      expect(result.currentHost).toBe('localhost');

      window.location = originalLocation;
    });

    it('should return all required properties', () => {
      const originalLocation = window.location;
      const originalIsSecureContext = window.isSecureContext;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          protocol: 'https:',
          hostname: 'localhost',
        },
      });

      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: true,
      });

      const result = isSharedArrayBufferSupported();
      expect(typeof result.isSupported).toBe('boolean');
      expect(typeof result.isCrossOriginIsolated).toBe('boolean');
      expect(typeof result.hasSharedArrayBuffer).toBe('boolean');
      expect(typeof result.isSecureContext).toBe('boolean');
      expect(typeof result.currentHost).toBe('string');
      expect(typeof result.currentProtocol).toBe('string');
      expect(typeof result.isLocalhost).toBe('boolean');

      window.location = originalLocation;
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: originalIsSecureContext,
      });
    });
  });
});
