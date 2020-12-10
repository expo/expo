import { Prism } from 'prism-react-renderer';

import { installGroovy } from './groovy';
import { installJson5 } from './json5';
import { installObjectiveC } from './objectivec';
import { installRuby } from './ruby';

export function installLanguages(prism: typeof Prism) {
  installGroovy(prism);
  installObjectiveC(prism);
  installRuby(prism);
  installJson5(prism);
}
