import * as React from 'react';
import requireContext from 'require-context.macro';

import UIExplorer, { storiesOf } from '../stories/ui-explorer';
import Markdown from '../stories/ui-explorer/Markdown';

let storiesCache = {};

const isTestEnv = process.env.BABEL_ENV === 'test:web';

export default function loadStory(filename, req, mdreq) {
  const _mdreq = mdreq || requireContext('../stories', true, /\.notes\.md$/);
  const moduleScreen = req(filename);
  if (!moduleScreen.component) {
    return;
  }
  let {
    component: Component,
    packageJson = {},
    notes,
    label,
    description,
    title,
    kind,
    onStoryCreated,
  } = moduleScreen;

  let markdown = notes;
  if (!notes) {
    const mdPath = filename.substring(0, filename.lastIndexOf('.stories')) + '.notes.md';
    markdown = _mdreq(mdPath);
  }

  const storiesKind = kind || 'SDK|' + filename.split('/')[1];


  if (Component === true && markdown) {
      if (isTestEnv) {
        //   console.log('Skipping markdown-only test: ', storiesKind);
          return;
      } else {
          Component = () => <Markdown>{markdown}</Markdown>;
      }
  }
  const screen = (props = {}) => (
    <UIExplorer
      title={title}
      url={filename}
      label={label}
      description={description || packageJson.description}
      packageName={packageJson.name}>
      <Component {...props} />
    </UIExplorer>
  );

  let stories = storiesCache[storiesKind];
  if (!stories) {
    stories = storiesOf(storiesKind, module);
    storiesCache[storiesKind] = stories;
  }
  stories.add(title, screen, {
    notes: { markdown },
  });
  if (onStoryCreated) {
    onStoryCreated({ stories });
  }
}
