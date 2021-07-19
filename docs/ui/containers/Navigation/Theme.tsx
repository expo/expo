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
} from '@expo/styleguide';
import React, { useEffect, useState } from 'react';

import { textStyles } from '~/ui/foundations/typography';

export const Theme = () => {
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
        {themeName === 'auto' && <ThemeAutoIcon size={iconSize.small} />}
        {themeName === 'dark' && <ThemeDarkIcon size={iconSize.small} />}
        {themeName === 'light' && <ThemeLightIcon size={iconSize.small} />}
      </div>
      <div css={themeIconStyle}>
        <ChevronDownIcon size={iconSize.small} />
      </div>
    </div>
  );
};

const containerStyle = css`
  position: relative;
  min-width: 120px;
`;

const selectStyle = css`
  ${textStyles.paragraph}
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  color: ${theme.text.default};
  line-height: 1.3;
  padding: 0px 36px 0px 36px;
  width: 100%;
  margin: 0;
  border: 1px solid ${theme.border.default};
  box-shadow: ${shadows.input};
  border-radius: 4px;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-color: ${theme.background.default};
  cursor: pointer;
  outline: none;
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
