import { Text } from 'react-native';
import { StyledComponent } from '../../utils';

export const WelcomeText = StyledComponent({
  fontSize: '32px',
  background: 'red',
  '@media(min-width: 768px)': {
    background: 'blue',
  }
}, Text);
