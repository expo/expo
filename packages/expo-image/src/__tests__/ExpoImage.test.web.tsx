import ExpoImage from '../ExpoImage.web';
import { getImageWrapperEventHandler } from '../web/getImageWrapperEventHandler';

jest.mock('../web/useSourceSelection', () => () => undefined);

// `typeof window` is compiled to `undefined` in the Node project, so rAF-driven events never fire there.
const itWithDom = typeof window === 'undefined' ? it.skip : it;

describe('ExpoImage', () => {
  it('merges a user-provided dataSet while preserving the Expo Image marker', () => {
    const element = ExpoImage({
      dataSet: { test: 'value' },
    });

    expect(element.props.dataSet).toEqual({ test: 'value', expoimage: 'true' });
  });

  itWithDom('emits only onPlaceholderDisplay when a placeholder is shown without a source', () => {
    const onDisplay = jest.fn();
    const onPlaceholderDisplay = jest.fn();
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    const element = ExpoImage({
      placeholder: [{ uri: 'https://example.com/placeholder.png' }],
      onDisplay,
      onPlaceholderDisplay,
    });
    const currentNode = element.props.children.props.children;
    const imageWrapper = currentNode[1]({})('', {});
    getImageWrapperEventHandler(imageWrapper.props.events, imageWrapper.props.source).onLoad(
      {} as any
    );

    expect(onPlaceholderDisplay).toHaveBeenCalledTimes(1);
    expect(onDisplay).not.toHaveBeenCalled();

    rafSpy.mockRestore();
  });
});
