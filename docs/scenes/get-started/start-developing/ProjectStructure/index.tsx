import { useState } from 'react';

import { Tab } from './Tab';
import AppJson from './files/app-json.mdx';
import App from './files/app.mdx';
import Assets from './files/assets.mdx';
import BabelConfigJs from './files/babel-config-js.mdx';
import Components from './files/components.mdx';
import Constants from './files/constants.mdx';
import Hooks from './files/hooks.mdx';
import PackageJson from './files/package-json.mdx';
import Scripts from './files/scripts.mdx';
import TsconfigJson from './files/tsconfig-json.mdx';

import { HEADLINE } from '~/ui/components/Text';

export function ProjectStructure() {
  const [selected, setSelected] = useState('app');

  return (
    <div className="text-default rounded-md overflow-hidden border border-default">
      <div className="bg-subtle p-3 flex pl-4 border-b border-default">
        <HEADLINE>Files</HEADLINE>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,_1fr)]">
        <div className="p-3 flex flex-col gap-1 md:border-r md:border-b-0 border-default border-b">
          <Tab
            title="app"
            onClick={() => setSelected('app')}
            isSelected={selected === 'app'}
            type="directory"
          />
          <Tab
            title="assets"
            onClick={() => setSelected('assets')}
            isSelected={selected === 'assets'}
            type="directory"
          />
          <Tab
            title="components"
            onClick={() => setSelected('components')}
            isSelected={selected === 'components'}
            type="directory"
          />
          <Tab
            title="constants"
            onClick={() => setSelected('constants')}
            isSelected={selected === 'constants'}
            type="directory"
          />
          <Tab
            title="hooks"
            onClick={() => setSelected('hooks')}
            isSelected={selected === 'hooks'}
            type="directory"
          />
          <Tab
            title="scripts"
            onClick={() => setSelected('scripts')}
            isSelected={selected === 'scripts'}
            type="directory"
          />
          <Tab
            title="app.json"
            onClick={() => setSelected('app.json')}
            isSelected={selected === 'app.json'}
            type="file"
          />
          <Tab
            title="babel.config.js"
            onClick={() => setSelected('babel.config.js')}
            isSelected={selected === 'babel.config.js'}
            type="file"
          />
          <Tab
            title="package.json"
            onClick={() => setSelected('package.json')}
            isSelected={selected === 'package.json'}
            type="file"
          />
          <Tab
            title="tsconfig.json"
            onClick={() => setSelected('tsconfig.json')}
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
          {selected === 'babel.config.js' ? <BabelConfigJs /> : null}
          {selected === 'package.json' ? <PackageJson /> : null}
          {selected === 'tsconfig.json' ? <TsconfigJson /> : null}
        </div>
      </div>
    </div>
  );
}

// - **tsconfig.json**
//   - Contains the rules that TypeScript will use to enforce type safety throughout the project.
