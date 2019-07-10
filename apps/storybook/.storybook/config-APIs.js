import { loadStory } from './config';
import requireContext from 'require-context.macro';
import { addDecorator, addParameters, configure } from '@storybook/react';

const req = requireContext('../stories/APIs', true, /\.stories\.jsx?$/);
const mdreq = requireContext('../stories/APIs', true, /\.notes\.md$/);
req.keys().forEach(filename => loadStory(filename, req, mdreq));