/**
 * Original by Samuel Flores
 *
 * Adds the following new token classes:
 *     constant, builtin, variable, symbol, regex
 */
export function installRuby(Prism: any) {
  Prism.languages.ruby = Prism.languages.extend('clike', {
    comment: [
      /#.*/,
      {
        pattern: /^=begin\s[\s\S]*?^=end/m,
        greedy: true,
      },
    ],
    'class-name': {
      pattern: /(\b(?:class)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: true,
      inside: {
        punctuation: /[.\\]/,
      },
    },
    keyword: /\b(?:alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|protected|private|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
  });

  const interpolation = {
    pattern: /#\{[^}]+\}/,
    inside: {
      delimiter: {
        pattern: /^#\{|\}$/,
        alias: 'tag',
      },
      rest: Prism.languages.ruby,
    },
  };

  delete Prism.languages.ruby.function;

  Prism.languages.insertBefore('ruby', 'keyword', {
    regex: [
      {
        pattern: /%r([^a-zA-Z0-9\s{([<])(?:(?!\1)[^\\]|\\[\s\S])*\1[gim]{0,3}/,
        greedy: true,
        inside: {
          interpolation,
        },
      },
      {
        pattern: /%r\((?:[^()\\]|\\[\s\S])*\)[gim]{0,3}/,
        greedy: true,
        inside: {
          interpolation,
        },
      },
      {
        // Here we need to specifically allow interpolation
        pattern: /%r\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}[gim]{0,3}/,
        greedy: true,
        inside: {
          interpolation,
        },
      },
      {
        pattern: /%r\[(?:[^[\]\\]|\\[\s\S])*\][gim]{0,3}/,
        greedy: true,
        inside: {
          interpolation,
        },
      },
      {
        pattern: /%r<(?:[^<>\\]|\\[\s\S])*>[gim]{0,3}/,
        greedy: true,
        inside: {
          interpolation,
        },
      },
      {
        pattern: /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[gim]{0,3}(?=\s*(?:$|[\r\n,.;})]))/,
        lookbehind: true,
        greedy: true,
      },
    ],
    variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
    symbol: {
      pattern: /(^|[^:]):[a-zA-Z_]\w*(?:[?!]|\b)/,
      lookbehind: true,
    },
    'method-definition': {
      pattern: /(\bdef\s+)[\w.]+/,
      lookbehind: true,
      inside: {
        function: /\w+$/,
        rest: Prism.languages.ruby,
      },
    },
  });

  Prism.languages.insertBefore('ruby', 'number', {
    builtin: /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|Fixnum|Float|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
    constant: /\b[A-Z]\w*(?:[?!]|\b)/,
  });

  Prism.languages.ruby.string = [
    {
      pattern: /%[qQiIwWxs]?([^a-zA-Z0-9\s{([<])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
      greedy: true,
      inside: {
        interpolation,
      },
    },
    {
      pattern: /%[qQiIwWxs]?\((?:[^()\\]|\\[\s\S])*\)/,
      greedy: true,
      inside: {
        interpolation,
      },
    },
    {
      // Here we need to specifically allow interpolation
      pattern: /%[qQiIwWxs]?\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}/,
      greedy: true,
      inside: {
        interpolation,
      },
    },
    {
      pattern: /%[qQiIwWxs]?\[(?:[^[\]\\]|\\[\s\S])*\]/,
      greedy: true,
      inside: {
        interpolation,
      },
    },
    {
      pattern: /%[qQiIwWxs]?<(?:[^<>\\]|\\[\s\S])*>/,
      greedy: true,
      inside: {
        interpolation,
      },
    },
    {
      pattern: /("|')(?:#\{[^}]+\}|\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true,
      inside: {
        interpolation,
      },
    },
  ];
}
