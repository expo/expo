import React from 'react';

import Markdown from '../ui-explorer/Markdown';
import notes from './0-Introduction.notes.md';

export const title = 'Intro';
export const kind = 'Expo|Getting Started';
export const component = () => <Markdown>{notes}</Markdown>;
