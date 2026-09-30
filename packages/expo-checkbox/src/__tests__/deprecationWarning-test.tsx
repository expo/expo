import { render } from '@testing-library/react-native';

import Checkbox from '../Checkbox';
import { DEPRECATION_MESSAGE } from '../deprecationWarning';

describe('deprecation warning', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns once when the checkbox renders', () => {
    render(<Checkbox value />);
    render(<Checkbox value={false} />);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(DEPRECATION_MESSAGE);
  });
});
