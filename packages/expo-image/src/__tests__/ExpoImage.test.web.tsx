import ExpoImage from '../ExpoImage.web';

jest.mock('../web/useSourceSelection', () => () => undefined);

// The image ExpoImage renders once the source has loaded, as opposed to the
// placeholder shown before it.
function renderLoadedImage(element: ReturnType<typeof ExpoImage>) {
  const [, renderNode] = element.props.children.props.children;
  const noop = () => {};
  return renderNode({ onAnimationFinished: noop, onReady: noop, onMount: noop, onError: noop })(
    '',
    {}
  );
}

describe('ExpoImage', () => {
  it('merges a user-provided dataSet while preserving the Expo Image marker', () => {
    const element = ExpoImage({
      dataSet: { test: 'value' },
    });

    expect(element.props.dataSet).toEqual({ test: 'value', expoimage: 'true' });
  });

  it('uses alt as the accessibility label of the loaded image', () => {
    const element = ExpoImage({ alt: 'Expo logo' });

    expect(renderLoadedImage(element).props.accessibilityLabel).toBe('Expo logo');
  });

  it('keeps an empty alt for decorative images', () => {
    const element = ExpoImage({ alt: '' });

    expect(renderLoadedImage(element).props.accessibilityLabel).toBe('');
  });

  it('prefers accessibilityLabel over alt', () => {
    const element = ExpoImage({ alt: 'alt', accessibilityLabel: 'label' });

    expect(renderLoadedImage(element).props.accessibilityLabel).toBe('label');
  });
});
