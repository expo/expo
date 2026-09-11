import ExpoImage from '../ExpoImage.web';

jest.mock('../web/useSourceSelection', () => () => undefined);

describe('ExpoImage', () => {
  it('merges a user-provided dataSet while preserving the Expo Image marker', () => {
    const element = ExpoImage({
      dataSet: { test: 'value' },
    });

    expect(element.props.dataSet).toEqual({ test: 'value', expoimage: 'true' });
  });
});
