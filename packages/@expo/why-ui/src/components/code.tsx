import cn from 'classnames';
import { Link } from 'expo-router';
import { Prism, Highlight, themes } from 'prism-react-renderer';

(typeof global !== 'undefined' ? global : window).Prism = Prism;

require('prismjs/components/prism-shell-session');
require('prismjs/components/prism-json');
require('prismjs/components/prism-json5');
require('prismjs/components/prism-css-extras.min');
require('prismjs/components/prism-css-extras.min');

const remapLanguages: Record<string, string> = {
  'objective-c': 'objc',
  sh: 'bash',
  shell: 'shell-session',
  rb: 'ruby',
  json: 'json5',
  javascript: 'js',
  typescript: 'ts',
};

const DRACULA_COLORS = {
  purple: 'rgb(189, 147, 249)',
  blue: '#A1E7FA',
  yellow: 'rgb(241, 250, 140)',
  pink: 'rgb(255, 121, 198)',
  green: 'rgb(80, 250, 123)',
};

const draculaPlusJson = {
  ...themes.dracula,
  styles: [
    ...themes.dracula.styles,
    ...[
      {
        types: ['boolean'],
        style: {
          color: DRACULA_COLORS.purple,
        },
      },
    ].map((selectors) => ({ ...selectors, languages: ['js', 'json5'] })),

    // JSON theme
    ...[
      {
        types: ['property'],
        style: {
          color: DRACULA_COLORS.blue,
        },
      },
      {
        types: ['string'],
        style: {
          color: DRACULA_COLORS.yellow,
        },
      },
      {
        types: ['boolean', 'number'],
        style: {
          color: DRACULA_COLORS.purple,
        },
      },
      {
        types: ['operator'],
        style: {
          color: DRACULA_COLORS.pink,
        },
      },
    ].map((selectors) => ({ ...selectors, languages: ['json', 'json5'] })),

    // CSS theme
    ...[
      {
        types: ['property'],
        style: {
          color: DRACULA_COLORS.blue,
        },
      },
      {
        types: ['class'],
        style: {
          color: DRACULA_COLORS.green,
        },
      },
      {
        types: ['atrule'],
        style: {
          color: DRACULA_COLORS.purple,
        },
      },
      {
        types: [
          'rule',
          'keyword',
          // 'punctuation'
        ],
        style: {
          color: DRACULA_COLORS.pink,
        },
      },
    ].map((selectors) => ({ ...selectors, languages: ['css', 'scss'] })),
  ],
};

// function getIconForFile(filename: string) {
//     if (/_layout\.[jt]sx?$/.test(filename)) {
//       return LayoutAlt01Icon;
//     }
//     return FileCode01Icon;
//   }

export function BaconCode(props: {
  children: string;
  // language-ts
  className: string;
  // "app.config.ts"
  metastring: string;
  dependencies?: Record<string, string>;
}) {
  let lang = props.className?.slice(9).toLowerCase() ?? 'txt';
  const isTerminal = ['terminal', 'term'].includes(lang.toLowerCase());

  if (isTerminal) {
    lang = 'shell-session';
  }

  if (lang in remapLanguages) {
    lang = remapLanguages[lang];
  }

  let title = !props.metastring
    ? ''
    : props.metastring.match(/title="(.*)"/)?.[1] ?? props.metastring;

  if (isTerminal && !title) {
    title = 'Terminal';
  }

  // const FileIcon = isTerminal ? TerminalSquareIcon : getIconForFile(title);

  return (
    <div
      data-lang={lang}
      className={cn('overflow-scroll')}
      style={{
        boxShadow: 'inset 0 0 0 1px #ffffff1a',
      }}>
      {title && (
        <span className="flex p-3 gap-2 border-b border-b-[#ffffff1a]">
          {/* <FileIcon className="w-4 text-slate-50" /> */}

          <h3
            className="text-slate-50"
            style={{
              fontWeight: 'bold',
              //   fontFamily: useFont('Inter_400Regular'),
            }}>
            {title}
          </h3>
        </span>
      )}

      <Highlight theme={draculaPlusJson} code={props.children.trim()} language={lang}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={style}
            className={cn(
              'p-4 overflow-auto padding-r-4 m-[1px] mt-0 grid',
              isTerminal && 'bg-black'
            )}>
            {tokens.map((line, i) => {
              return (
                <div key={i} {...getLineProps({ line })} className="inline">
                  {/* Line Number */}
                  <span className="w-8 inline-block select-none opacity-50">{i + 1}</span>
                  {line.map((token, key) => {
                    const { className, ...props } = getTokenProps({ token });

                    // const isStringToken =
                    //   token.types.length === 1 && token.types.includes('string');
                    // const possibleRequireName = isStringToken ? unQuote(token.content) : null;
                    // const isRequire = possibleRequireName
                    //   ? props.dependencies[possibleRequireName]
                    //   : null;
                    const isRequire = null;
                    // console.log('token', token);

                    const jsx = <span key={key} {...props} className={cn(className)} />;
                    if (isRequire) {
                      return (
                        <Link
                          asChild
                          href={{ pathname: '/module/[id]', params: { id: isRequire } }}>
                          {jsx}
                        </Link>
                      );
                    }
                    return jsx;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function unQuote(str: string) {
  return str.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}
