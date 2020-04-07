import { installGroovy } from './groovy';
import { installObjectiveC } from './objectivec';
import { installRuby } from './ruby';
import { installJson5 } from './json5';

export function installLanguages(Prism) {
  installGroovy(Prism);
  installObjectiveC(Prism);
  installRuby(Prism);
  installJson5(Prism);
}
