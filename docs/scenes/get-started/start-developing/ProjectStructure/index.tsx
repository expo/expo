import { mergeClasses } from '@expo/styleguide';
import { useState } from 'react';

import { HEADLINE } from '~/ui/components/Text';

import { Tab } from './Tab';
import AppJson from './files/app-json.mdx';
import App from './files/app.mdx';
import Assets from './files/assets.mdx';
import Components from './files/components.mdx';
import Constants from './files/constants.mdx';
import Hooks from './files/hooks.mdx';
import PackageJson from './files/package-json.mdx';
import Scripts from './files/scripts.mdx';
import TsconfigJson from './files/tsconfig-json.mdx';

export function ProjectStructure() {
  const [selected, setSelected] = useState('app');

  return (
    <div className="border-default text-default overflow-hidden rounded-md border">
      <div className="border-default bg-subtle flex border-b p-3 pl-4">
        <HEADLINE>Files</HEADLINE>
      </div>
      <div className="max-md-gutters:grid-cols-1 grid grid-cols-[250px_minmax(0,_1fr)]">
        <div
          className={mergeClasses(
            'border-default flex flex-col gap-1 border-r p-3',
            'max-md-gutters:border-b max-md-gutters:border-r-0'
          )}>
          <Tab
            title="src/app"
            onClick={() => {
              setSelected('app');
            }}
            isSelected={selected === 'app'}
            type="directory"
          />
          <Tab
            title="src/components"
            onClick={() => {
              setSelected('components');
            }}
            isSelected={selected === 'components'}
            type="directory"
          />
          <Tab
            title="src/constants"
            onClick={() => {
              setSelected('constants');
            }}
            isSelected={selected === 'constants'}
            type="directory"
          />
          <Tab
            title="src/hooks"
            onClick={() => {
              setSelected('hooks');
            }}
            isSelected={selected === 'hooks'}
            type="directory"
          />
          <Tab
            title="assets"
            onClick={() => {
              setSelected('assets');
            }}
            isSelected={selected === 'assets'}
            type="directory"
          />
          <Tab
            title="scripts"
            onClick={() => {
              setSelected('scripts');
            }}
            isSelected={selected === 'scripts'}
            type="directory"
          />
          <Tab
            title="app.json"
            onClick={() => {
              setSelected('app.json');
            }}
            isSelected={selected === 'app.json'}
            type="file"
          />
          <Tab
            title="package.json"
            onClick={() => {
              setSelected('package.json');
            }}
            isSelected={selected === 'package.json'}
            type="file"
          />
          <Tab
            title="tsconfig.json"
            onClick={() => {
              setSelected('tsconfig.json');
            }}
            isSelected={selected === 'tsconfig.json'}
            type="file"
          />
        </div>
        <div className="bg-default px-6">
          {selected === 'app' ? <App /> : null}
          {selected === 'assets' ? <Assets /> : null}
          {selected === 'components' ? <Components /> : null}
          {selected === 'constants' ? <Constants /> : null}
          {selected === 'hooks' ? <Hooks /> : null}
          {selected === 'scripts' ? <Scripts /> : null}
          {selected === 'app.json' ? <AppJson /> : null}
          {selected === 'package.json' ? <PackageJson /> : null}
          {selected === 'tsconfig.json' ? <TsconfigJson /> : null}
        </div>
      </div>
    </div>
  );
}
