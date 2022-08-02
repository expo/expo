import { useContext } from 'react';

import { ThemeContext } from './ThemeProvider';

const useTheme = () => useContext(ThemeContext);

export default useTheme;
