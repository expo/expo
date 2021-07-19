import { Language, Prism } from 'prism-react-renderer';

import { installGroovy } from './languages/groovy';
import { installJson5 } from './languages/json5';
import { installKotlin } from './languages/kotlin';
import { installObjectiveC } from './languages/objectivec';
import { installRuby } from './languages/ruby';
import { installSwift } from './languages/swift';

/**
 * Add the custom languages to Prism.
 * By default, it uses the Prism instance from `prism-react-renderer`.
 */
export function installLanguages(prism: typeof Prism = Prism) {
  installGroovy(prism);
  installObjectiveC(prism);
  installRuby(prism);
  installJson5(prism);
  installKotlin(prism);
  installSwift(prism);
}

/**
 * Convert a langague from MDX to Prism.
 */
export function getPrismLanguage(language: string): Language {
  if (language.startsWith('language-')) {
    language = language.substr('language-'.length);
  }

  if (language in remapLanguages) {
    language = remapLanguages[language];
  }

  return language as Language;
}

const remapLanguages: Record<string, string> = {
  js: 'javascript',
  'objective-c': 'objc',
  sh: 'bash',
  rb: 'ruby',
};
