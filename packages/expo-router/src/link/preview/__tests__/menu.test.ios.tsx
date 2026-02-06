import { render } from '@testing-library/react-native';
import React from 'react';

import { InternalLinkPreviewContext } from '../../InternalLinkPreviewContext';
import { NativeMenuContext } from '../../NativeMenuContext';
import { LinkMenu, LinkMenuAction } from '../../elements';
import { NativeLinkPreviewAction } from '../native';

// Mock dependencies
jest.mock('../../preview/PreviewRouteContext', () => ({
  useIsPreview: jest.fn(() => false),
}));

jest.mock('../native', () => ({
  NativeLinkPreviewAction: jest.fn(() => null),
}));

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, EXPO_OS: 'ios' };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('LinkMenu', () => {
  const mockContext = {
    isVisible: true,
    href: '/test',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NativeMenuContext value>
      <InternalLinkPreviewContext value={mockContext}>{children}</InternalLinkPreviewContext>
    </NativeMenuContext>
  );

  describe('inline and palette prop combinations', () => {
    it('passes inline prop correctly when inline=true', () => {
      render(
        <LinkMenu inline title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledTimes(1);
      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayInline: true,
          displayAsPalette: undefined,
        }),
        undefined
      );
    });

    it('passes palette prop correctly when palette=true', () => {
      render(
        <LinkMenu palette title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayAsPalette: true,
          displayInline: undefined,
        }),
        undefined
      );
    });

    it('passes both inline and palette props when both are true', () => {
      render(
        <LinkMenu inline palette title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayInline: true,
          displayAsPalette: true,
        }),
        undefined
      );
    });

    it('prefers palette over displayAsPalette', () => {
      render(
        <LinkMenu palette displayAsPalette={false} title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayAsPalette: true,
        }),
        undefined
      );
    });

    it('uses displayAsPalette when palette is not provided', () => {
      render(
        <LinkMenu displayAsPalette title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayAsPalette: true,
        }),
        undefined
      );
    });

    it('prefers inline over displayInline (deprecated)', () => {
      render(
        <LinkMenu inline displayInline={false} title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayInline: true,
        }),
        undefined
      );
    });

    it('uses displayInline when inline is not provided', () => {
      render(
        <LinkMenu displayInline title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayInline: true,
        }),
        undefined
      );
    });

    it('passes all deprecated and new props together correctly', () => {
      render(
        <LinkMenu palette={false} displayAsPalette inline={false} displayInline title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayAsPalette: false,
          displayInline: false,
        }),
        undefined
      );
    });

    it('handles undefined values for inline and palette', () => {
      render(
        <LinkMenu title="Test">
          <LinkMenuAction title="test" onPress={() => {}} />
        </LinkMenu>,
        { wrapper }
      );

      expect(NativeLinkPreviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          displayInline: undefined,
          displayAsPalette: undefined,
        }),
        undefined
      );
    });
  });
});
