import * as React from 'react';

import { Image } from '../Image';

const icon = require('../../assets/question-mark-icon.png');

export function QuestionMarkIcon(props: Partial<React.ComponentProps<typeof Image>>) {
  return <Image source={icon} {...props} />;
}
