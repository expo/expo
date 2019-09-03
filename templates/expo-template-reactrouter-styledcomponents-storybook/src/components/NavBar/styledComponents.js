import { View } from 'react-native';
import { StyledComponent } from '../../utils';

export const NavBarContainer = StyledComponent({
  display: 'flex',
  flexDirection: 'row',
  '@media(min-width: 768px)': {
    position: 'fixed',
    top: 0,
    right: 0,
    background: 'white',
    flexDirection: 'column',
  }
}, View);

export const NavBarItem = StyledComponent({
  padding: '16px',
}, View);
