import { installGroovy } from './groovy';
import { installObjectiveC } from './objectivec';
import { installRuby } from './ruby';

export function installLanguages(Prism) {
  installGroovy(Prism);
  installObjectiveC(Prism);
  installRuby(Prism);
}
