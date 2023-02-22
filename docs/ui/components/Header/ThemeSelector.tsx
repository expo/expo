import { css } from '@emotion/react';
import {
  useTheme,
  theme,
  ChevronDownIcon,
  ThemeAutoIcon,
  ThemeDarkIcon,
  ThemeLightIcon,
  iconSize,
  shadows,
  spacing,
  typography,
  borderRadius,
} from '@expo/styleguide';
import React, { useEffect, useState } from 'react';

export const ThemeSelector = () => {
  const { themeName, setAutoMode, setDarkMode, setLightMode } = useTheme();
  const [isLoaded, setLoaded] = useState(false);

  useEffect(function didMount() {
    setLoaded(true);
  }, []);

  if (!isLoaded) return <div css={containerStyle} />;

  return (
    <div css={containerStyle}>
      <select
        css={selectStyle}
        value={themeName}
        onChange={e => {
          const option = e.target.value;

          if (option === 'auto') setAutoMode();
          if (option === 'dark') setDarkMode();
          if (option === 'light') setLightMode();
        }}>
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <div css={selectIconStyle}>
        {themeName === 'auto' && <ThemeAutoIcon size={iconSize.sm} />}
        {themeName === 'dark' && <ThemeDarkIcon size={iconSize.sm} />}
        {themeName === 'light' && <ThemeLightIcon size={iconSize.sm} />}
      </div>
      <div css={themeIconStyle}>
        <ChevronDownIcon size={iconSize.sm} />
      </div>
    </div>
  );
};

const containerStyle = css`
  position: relative;
  min-width: 120px;
`;

const selectStyle = css`
  ${typography.fontSizes[14]}
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  color: ${theme.text.default};
  line-height: 1.3;
  padding: 0 ${spacing[9]}px;
  width: 100%;
  margin: 0;
  border: 1px solid ${theme.border.default};
  box-shadow: ${shadows.xs};
  border-radius: ${borderRadius.md}px;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-color: ${theme.background.default};
  cursor: pointer;
`;

const selectIconStyle = css`
  position: absolute;
  left: 12px;
  top: 12px;
  pointer-events: none;
`;

const themeIconStyle = css`
  position: absolute;
  right: 12px;
  top: 12px;
  pointer-events: none;
`;
