import styled from 'styled-components';
import { StyledComponent } from '../styledComponents';

jest.mock('styled-components');

describe('StyledComponent', () => {
  let stylesSpy;

  beforeEach(() => {
    stylesSpy = jest.fn(() => 'returned styled component');
    styled.mockImplementation(() => stylesSpy)
  });

  it('calls chosen css-in-js framework and returns its result', () => {
    const styles = { color: 'green' };
    const styledComponent = StyledComponent(styles, 'div');
    expect(styled).toBeCalledWith('div');
    expect(stylesSpy).toBeCalledWith(styles);
    expect(styledComponent).toEqual('returned styled component');
  })
})
