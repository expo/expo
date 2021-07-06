import { Prism } from 'prism-react-renderer';

import { installGroovy } from './groovy';
import { installJson5 } from './json5';
import { installKotlin } from './kotlin';
import { installObjectiveC } from './objectivec';
import { installProperties } from './properties';
import { installRuby } from './ruby';
import { installSwift } from './swift';

export function installLanguages(prism: typeof Prism) {
  installGroovy(prism);
  installObjectiveC(prism);
  installProperties(prism);
  installRuby(prism);
  installJson5(prism);
  installKotlin(prism);
  installSwift(prism);
}
