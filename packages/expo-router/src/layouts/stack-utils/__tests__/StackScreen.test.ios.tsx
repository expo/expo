import { Text } from 'react-native';

import * as StackHeaderModule from '../StackHeaderComponent';
import { StackHeaderComponent } from '../StackHeaderComponent';
import { appendScreenStackPropsToOptions } from '../StackScreen';
import { StackScreenBackButton, StackScreenTitle } from '../screen';
import * as StackScreenBackButtonModule from '../screen/StackScreenBackButton';
import * as StackScreenTitleModule from '../screen/StackScreenTitle';
import { StackToolbar } from '../toolbar';
import * as StackToolbarClientModule from '../toolbar/StackToolbarClient';

describe(appendScreenStackPropsToOptions, () => {
  describe('options merging', () => {
    it('merges options prop with base options', () => {
      const result = appendScreenStackPropsToOptions(
        { headerShown: true },
        { options: { title: 'New Title' } }
      );
      expect(result.headerShown).toBe(true);
      expect(result.title).toBe('New Title');
    });

    it('options prop overwrites base options', () => {
      const result = appendScreenStackPropsToOptions(
        { title: 'Base Title' },
        { options: { title: 'New Title' } }
      );
      expect(result.title).toBe('New Title');
    });
  });

  describe('StackHeaderComponent processing', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(StackHeaderModule, 'appendStackHeaderPropsToOptions');
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it('calls appendStackHeaderPropsToOptions with correct props', () => {
      const props = {
        blurEffect: 'regular' as const,
        transparent: true,
        style: { color: 'blue' },
      };

      appendScreenStackPropsToOptions(
        {},
        {
          children: <StackHeaderComponent {...props} />,
        }
      );

      expect(spy).toHaveBeenCalledWith({}, props);
    });

    it('correctly outputs options for multiple props', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: (
            <StackHeaderComponent
              blurEffect="systemMaterial"
              transparent
              style={{ color: 'red', backgroundColor: 'white' }}
            />
          ),
        }
      );

      expect(result.headerBlurEffect).toBe('systemMaterial');
      expect(result.headerTransparent).toBe(true);
      expect(result.headerTintColor).toBe('red');
      expect(result.headerShown).toBe(true);
    });
  });

  describe('StackScreenTitle processing', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(StackScreenTitleModule, 'appendStackScreenTitlePropsToOptions');
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it('calls appendStackScreenTitlePropsToOptions with correct props', () => {
      const props = {
        children: 'Test Title',
        large: true,
        style: { fontSize: 18 },
      };

      appendScreenStackPropsToOptions(
        {},
        {
          children: <StackScreenTitle {...props} />,
        }
      );

      expect(spy).toHaveBeenCalledWith({}, props);
    });

    it('correctly outputs options for multiple props', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: (
            <StackScreenTitle large style={{ textAlign: 'center', fontWeight: 'bold' }}>
              Page Title
            </StackScreenTitle>
          ),
        }
      );

      expect(result.title).toBe('Page Title');
      expect(result.headerLargeTitle).toBe(true);
      expect(result.headerTitleAlign).toBe('center');
      expect(result.headerTitleStyle).toBeDefined();
    });
  });

  describe('StackScreenBackButton processing', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(StackScreenBackButtonModule, 'appendStackScreenBackButtonPropsToOptions');
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it('calls appendStackScreenBackButtonPropsToOptions with correct props', () => {
      const props = {
        children: 'Back',
        displayMode: 'minimal' as const,
        withMenu: true,
      };

      appendScreenStackPropsToOptions(
        {},
        {
          children: <StackScreenBackButton {...props} />,
        }
      );

      expect(spy).toHaveBeenCalledWith({}, props);
    });

    it('correctly outputs options for multiple props', () => {
      const imageSource = { uri: 'https://example.com/back.png' };
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: (
            <StackScreenBackButton displayMode="minimal" withMenu src={imageSource} hidden={false}>
              Go Back
            </StackScreenBackButton>
          ),
        }
      );

      expect(result.headerBackTitle).toBe('Go Back');
      expect(result.headerBackButtonDisplayMode).toBe('minimal');
      expect(result.headerBackButtonMenuEnabled).toBe(true);
      expect(result.headerBackImageSource).toEqual(imageSource);
      expect(result.headerBackVisible).toBe(true);
    });
  });

  describe('StackToolbar left/right placement processing', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(StackToolbarClientModule, 'appendStackToolbarPropsToOptions');
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it.each(['left', 'right'] as const)(
      'calls appendStackToolbarPropsToOptions with correct props for %s placement',
      (placement) => {
        const children = <StackToolbar.Button icon="sidebar.left" />;
        const props = {
          placement,
          children,
        };

        appendScreenStackPropsToOptions(
          {},
          {
            children: <StackToolbar {...props} />,
          }
        );

        expect(spy).toHaveBeenCalledWith({}, props);
      }
    );

    it.each(['left', 'right'] as const)(
      'correctly outputs options for %s placement with multiple buttons',
      (placement) => {
        const result = appendScreenStackPropsToOptions(
          {},
          {
            children: (
              <StackToolbar placement={placement}>
                <StackToolbar.Button icon="sidebar.left" />
                <StackToolbar.Button icon="star" />
              </StackToolbar>
            ),
          }
        );

        const itemsKey =
          placement === 'left' ? 'unstable_headerLeftItems' : 'unstable_headerRightItems';
        const otherKey =
          placement === 'left' ? 'unstable_headerRightItems' : 'unstable_headerLeftItems';

        expect(result.headerShown).toBe(true);
        expect(result[itemsKey]).toBeDefined();
        expect(typeof result[itemsKey]).toBe('function');
        const items = result[itemsKey]?.({});
        expect(items).toHaveLength(2);
        expect(items?.[0].type).toBe('button');
        expect(items?.[1].type).toBe('button');
        expect(result[otherKey]).toBeUndefined();
      }
    );

    it.each(['left', 'right'] as const)(
      'correctly outputs options for %s placement with asChild',
      (placement) => {
        const CustomChild = <Text>Custom {placement}</Text>;
        const result = appendScreenStackPropsToOptions(
          {},
          {
            children: (
              <StackToolbar placement={placement} asChild>
                {CustomChild}
              </StackToolbar>
            ),
          }
        );

        const headerKey = placement === 'left' ? 'headerLeft' : 'headerRight';
        const itemsKey =
          placement === 'left' ? 'unstable_headerLeftItems' : 'unstable_headerRightItems';

        expect(result.headerShown).toBe(true);
        expect(result[headerKey]).toBeDefined();
        expect(typeof result[headerKey]).toBe('function');
        expect(result[itemsKey]).toBeUndefined();
      }
    );
  });

  describe('StackToolbar bottom placement error', () => {
    it('throws error for bottom toolbar in layout', () => {
      expect(() => {
        appendScreenStackPropsToOptions(
          {},
          {
            children: (
              <StackToolbar placement="bottom">
                <StackToolbar.Button icon="seal" />
              </StackToolbar>
            ),
          }
        );
      }).toThrow('Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen.');
    });

    it('throws error for toolbar without placement (defaults to bottom)', () => {
      expect(() => {
        appendScreenStackPropsToOptions(
          {},
          {
            children: (
              <StackToolbar>
                <StackToolbar.Button icon="seal" />
              </StackToolbar>
            ),
          }
        );
      }).toThrow('Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen.');
    });
  });

  describe('unknown children warning', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('warns for unknown children', () => {
      appendScreenStackPropsToOptions(
        {},
        {
          children: <Text>Unknown Child</Text>,
        }
      );

      expect(consoleSpy).toHaveBeenCalledWith('Unknown child element passed to Stack.Screen: Text');
    });

    it('does not warn for known children', () => {
      appendScreenStackPropsToOptions(
        {},
        {
          children: [
            <StackScreenTitle key="title">Title</StackScreenTitle>,
            <StackScreenBackButton key="back">Back</StackScreenBackButton>,
            <StackHeaderComponent key="header" />,
            <StackToolbar key="toolbar" placement="left">
              <StackToolbar.Button icon="star" />
            </StackToolbar>,
          ],
        }
      );

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('multiple children processing', () => {
    it('processes multiple children of different types', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: [
            <StackScreenTitle key="title">Page Title</StackScreenTitle>,
            <StackScreenBackButton key="back">Back</StackScreenBackButton>,
            <StackHeaderComponent key="header" blurEffect="systemMaterial" />,
            <StackToolbar key="toolbar-right" placement="right">
              <StackToolbar.Button icon="ellipsis" />
            </StackToolbar>,
          ],
        }
      );

      expect(result.title).toBe('Page Title');
      expect(result.headerBackTitle).toBe('Back');
      expect(result.headerBlurEffect).toBe('systemMaterial');
      expect(result.unstable_headerRightItems).toBeDefined();
    });

    it('later children can override earlier children options', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: [
            <StackScreenTitle key="title1">First Title</StackScreenTitle>,
            <StackScreenTitle key="title2">Second Title</StackScreenTitle>,
          ],
        }
      );

      expect(result.title).toBe('Second Title');
    });
  });

  describe('non-element children', () => {
    it('ignores null children', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: [<StackScreenTitle key="title">Title</StackScreenTitle>, null],
        }
      );

      expect(result.title).toBe('Title');
    });

    it('ignores undefined children', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: [<StackScreenTitle key="title">Title</StackScreenTitle>, undefined],
        }
      );

      expect(result.title).toBe('Title');
    });

    it('ignores boolean children', () => {
      const result = appendScreenStackPropsToOptions(
        {},
        {
          children: [<StackScreenTitle key="title">Title</StackScreenTitle>, false, true],
        }
      );

      expect(result.title).toBe('Title');
    });
  });
});
