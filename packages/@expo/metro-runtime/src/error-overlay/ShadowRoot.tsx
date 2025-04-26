/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';

export function ShadowRoot({ children }: { children: React.ReactNode }) {
  // TODO: Use shadow DOM to isolate styles
  return (
    <>
      <style>{`
        /* TODO: Ensure these don't end up in the user project in production. Maybe use :host */
:root {
  /* Some of these are based on UIKit colors in dark mode: https://github.com/EvanBacon/expo-apple-colors/blob/80f541c38c7fadcbd8a1fe85800eea0b3a97079b/colors.css#L1 */
  --expo-log-color-border: #313538;
  --expo-log-color-label: #edeef0;
  --expo-log-color-background: #111113;
  --expo-log-secondary-label: rgba(234.6, 234.6, 244.8, 0.6);
  --expo-log-secondary-system-background: rgba(28.05, 28.05, 30.6, 1);
  --expo-log-secondary-system-grouped-background: color(display-p3 0.095 0.098 0.105);
  --expo-log-secondary-system-background-hover: color(display-p3 0.156 0.163 0.176);
  --expo-log-color-danger: color(display-p3 0.861 0.403 0.387);
  --expo-log-syntax-red: color(display-p3 0.861 0.403 0.387);
  --expo-log-syntax-orange: color(display-p3 1 0.63 0.38);
  --expo-log-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  --expo-log-font-mono: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}
        `}</style>
      {children}
    </>
  );
  //   const shadowRef = React.useRef<HTMLDivElement>(null);
  //   const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  //   useEffect(() => {
  //     if (shadowRef.current) {
  //       const root = shadowRef.current!.attachShadow({ mode: 'open' });
  //       //   root.appendChild(shadowRef.current!);

  //       // shadowRef.current.shadowRoot!.innerHTML = shadowRef.current.innerHTML;
  //       // shadowRef.current.innerHTML = '';

  //       setShadowRoot(root);
  //     }
  //   }, []);

  //   return (
  //     <div ref={shadowRef} className="expo-shadow-host">
  //       {!!shadowRoot && (
  //         <>
  //           <style>{`
  //           :host{
  //             all:initial;
  //             direction:ltr;
  //             margin:0;
  //             font-family:sans-serif;
  //             line-height:1.15;
  //             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji';
  //             font-size:16px;
  //             font-weight:400;
  //             line-height:1.5;
  //             text-align:left;
  //             -webkit-text-size-adjust:100%;
  //             -webkit-tap-highlight-color:rgba(0,0,0,0);
  //           }
  //           *,*::before,*::after { box-sizing: border-box }
  //           article,aside,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}
  //           :host:not(button){background-color:#fff}
  //           [tabindex='-1']:focus:not(:focus-visible){outline:0 !important}
  //           hr{box-sizing:content-box;height:0;overflow:visible}
  //           h1,h2,h3,h4,h5,h6{margin-top:0;margin-bottom:8px}
  //           p{margin-top:0;margin-bottom:16px}

  //           :host {
  //             display: block;
  //             position: fixed;
  //             top: 0;
  //             left: 0;
  //             bottom: 0;
  //             right: 0;
  //             height: 100vh;
  //             width: 100vh;
  //             z-index: 9999;
  //           ${CSS_VARIABLES}
  //           }`}</style>
  //           {children}
  //         </>
  //       )}
  //     </div>
  //   );
}
