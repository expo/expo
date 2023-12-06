import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import React from 'react';

type FileStatusProps = {
  type: string;
};

export const FileStatus = ({ type }: FileStatusProps) => {
  const labels = {
    add: 'ADDED',
    modify: 'MODIFIED',
    delete: 'DELETED',
    rename: 'RENAMED',
  };

  const labelSpecificTagStyle = [
    type === 'add' && insertTagStyle,
    type === 'modify' && modifyTagStyle,
    type === 'delete' && deleteTagStyle,
  ];

  return (
    <div css={[tagStyle, labelSpecificTagStyle]}>
      <span css={labelStyle}>{labels[type as keyof typeof labels]}</span>
    </div>
  );
};

const insertTagStyle = css({
  color: theme.text.success,
  backgroundColor: theme.palette.green2,
  borderColor: theme.border.success,
});

const deleteTagStyle = css({
  color: theme.text.danger,
  backgroundColor: theme.palette.red2,
  borderColor: theme.border.danger,
});

const modifyTagStyle = css({
  color: theme.text.warning,
  backgroundColor: theme.palette.yellow2,
  borderColor: theme.border.warning,
});

const tagStyle = css({
  display: 'inline-flex',
  height: 22,
  fontWeight: 600,
  padding: `${spacing[1]}px ${spacing[1]}px`,
  borderRadius: borderRadius.sm,
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  gap: spacing[1],

  'table &': {
    marginTop: 0,
    marginBottom: spacing[2],
    padding: `${spacing[0.5]}px ${spacing[1.5]}px`,
  },

  'nav &': {
    whiteSpace: 'pre',
  },

  'h3 &': {
    fontSize: '80%',
  },
});

const labelStyle = css({
  lineHeight: `${spacing[4]}px`,
  fontWeight: 'normal',
});
