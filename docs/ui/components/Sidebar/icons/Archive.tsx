import { iconSize, theme } from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';

export const ArchiveIcon = ({ size = iconSize.sm }: IconProps) => {
  return (
    <svg width={size} height={size} viewBox="0 0 15 16" fill="none">
      <path
        d="M12.75 5.50537V13.0887H2.25V5.50537"
        stroke={theme.icon.default}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9168 2.58875H1.0835V5.50541H13.9168V2.58875Z"
        stroke={theme.icon.default}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.33325 7.83875H8.66658"
        stroke={theme.icon.default}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
