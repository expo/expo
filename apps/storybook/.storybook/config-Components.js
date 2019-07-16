import loadStory from './loadStory';
import requireContext from 'require-context.macro';
import { addDecorator, addParameters, configure } from '@storybook/react';

const req = requireContext('../stories/Components', true, /\.stories\.jsx?$/);
const mdreq = requireContext('../stories/Components', true, /\.notes\.md$/);
req.keys().forEach(filename => loadStory(filename, req, mdreq));
