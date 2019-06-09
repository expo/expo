import { loadStory } from './config';
import requireContext from 'require-context.macro';
import { addDecorator, addParameters, configure } from '@storybook/react';

// configure(() => {
const req = requireContext('../stories/APIs', true, /\.stories\.jsx?$/);
const mdreq = requireContext('../stories/APIs', true, /\.notes\.md$/);
// loadModule('./apis/Accelerometer.stories.jsx');
req.keys().forEach(filename => loadStory(filename, req, mdreq));
// }, global.module);
