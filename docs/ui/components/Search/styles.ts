import { css } from '@emotion/react';
import { borderRadius, iconSize, shadows, spacing, theme, typography } from '@expo/styleguide';

import { kbdStyle } from '~/ui/components/Text';

export const DocSearchStyles = css`
  /* === Variables === */

  :root {
    --docsearch-primary-color: ${theme.palette.primary[500]};
    --docsearch-text-color: ${theme.text.default};
    --docsearch-spacing: ${spacing[4]}px;
    --docsearch-icon-color: ${theme.icon.secondary};
    --docsearch-icon-stroke-width: 1.4;
    --docsearch-highlight-color: var(--docsearch-primary-color);
    --docsearch-muted-color: rgb(150, 159, 175);

    /* modal */
    --docsearch-modal-width: 40vw;
    --docsearch-modal-height: 74vh;
    --docsearch-modal-background: ${theme.background.default};
    --docsearch-modal-shadow: ${shadows.popover};

    /* searchbox */
    --docsearch-searchbox-height: 56px;
    --docsearch-searchbox-background: ${theme.background.default};
    --docsearch-searchbox-focus-background: ${theme.background.default};
    --docsearch-searchbox-shadow: none;

    /* hit */
    --docsearch-hit-height: 56px;
    --docsearch-hit-color: ${theme.text.secondary};
    --docsearch-hit-active-color: ${theme.background.tertiary};
    --docsearch-hit-background: ${theme.background.default};
    --docsearch-hit-shadow: none;

    /* footer */
    --docsearch-footer-height: 44px;
    --docsearch-footer-background: ${theme.background.secondary};
  }

  /* Dark Theme overwrites */

  html[data-expo-theme='dark'] {
    .DocSearch-Hits mark {
      background: ${theme.palette.primary[200]};
    }

    .DocSearch-Hit[aria-selected='true'] mark {
      background: ${theme.palette.primary[300]};
    }

    .DocSearch-Hit-icon {
      opacity: 0.6;
    }

    .DocSearch-Hit-action-button:hover path,
    .DocSearch-Hit-action-button:focus path {
      fill: ${theme.palette.primary[600]};
      stroke: ${theme.palette.primary[600]};
    }

    .DocSearch-Hit[aria-selected='true'] .DocSearch-Hit-icon:before {
      filter: brightness(1.25);
    }
  }

  /* === Button === */

  .DocSearch-Button {
    align-items: center;
    background: var(--docsearch-searchbox-background);
    border: 0;
    border-radius: ${borderRadius.medium}px;
    color: var(--docsearch-muted-color);
    cursor: pointer;
    display: flex;
    font-weight: 500;
    height: 40px;
    justify-content: space-between;
    margin: 0 ${spacing[3]}px 0;
    padding: ${spacing[0.5]}px ${spacing[3]}px;
    user-select: none;
    width: 24vw;
    max-width: 320px;
    box-shadow: ${shadows.input};
    border: 1px solid ${theme.border.default};
  }

  .DocSearch-Button:hover,
  .DocSearch-Button:active,
  .DocSearch-Button:focus {
    color: var(--docsearch-text-color);
    outline: none;
  }

  .DocSearch-Button-Container {
    align-items: center;
    display: flex;
  }

  .DocSearch-Search-Icon {
    stroke-width: 1.6;
  }

  .DocSearch-Button .DocSearch-Search-Icon {
    color: ${theme.icon.default};
    width: ${iconSize.small}px;
    margin-right: ${spacing[1]}px;
  }

  .DocSearch-Button-Placeholder {
    font-size: 1rem;
    padding: 0 12px 0 6px;
    color: ${theme.text.secondary};
    opacity: 0.66;
  }

  .DocSearch-Button-Keys {
    display: flex;
    gap: ${spacing[1.5]}px;
  }

  .DocSearch-Button-Key {
    display: flex;
    align-items: center;
    ${typography.utility.pre}
    ${kbdStyle}
    height: 20px;
    min-width: 22px;
  }

  @media (max-width: 768px) {
    .DocSearch-Button {
      width: 42px;
    }

    .DocSearch-Button-Keys,
    .DocSearch-Button-Placeholder {
      display: none;
    }
  }

  /* === Modal === */
  /* Body modifier */

  .DocSearch--active {
    overflow: hidden !important;
  }

  .DocSearch--active #__next {
    filter: blur(3px);
  }

  /* Container & Modal */

  .DocSearch-Container,
  .DocSearch-Container * {
    box-sizing: border-box;
  }

  .DocSearch-Container {
    background-color: rgba(0, 0, 0, 0.33);
    height: 100vh;
    left: 0;
    position: fixed;
    top: 0;
    width: 100vw;
    z-index: 200;
  }

  .DocSearch-Container a {
    text-decoration: none;
  }

  .DocSearch-Link {
    appearance: none;
    background: none;
    border: 0;
    color: var(--docsearch-highlight-color);
    cursor: pointer;
    font: inherit;
    margin: 0;
    padding: 0;
  }

  .DocSearch-Modal {
    background: var(--docsearch-modal-background);
    border-radius: ${borderRadius.large}px;
    box-shadow: var(--docsearch-modal-shadow);
    flex-direction: column;
    margin: 72px auto auto;
    max-width: var(--docsearch-modal-width);
    min-width: 680px;
    position: relative;
    border: 1px solid ${theme.border.default};
  }

  /* Modal Searchbox */

  .DocSearch-SearchBar {
    display: flex;
    padding: var(--docsearch-spacing) var(--docsearch-spacing) ${spacing[3]}px;
    border-bottom: 1px solid ${theme.border.default};
  }

  .DocSearch-Form {
    align-items: center;
    background: var(--docsearch-searchbox-focus-background);
    border-radius: 4px;
    box-shadow: var(--docsearch-searchbox-shadow);
    display: flex;
    height: var(--docsearch-searchbox-height);
    margin: 0;
    padding: 0 var(--docsearch-spacing);
    position: relative;
    width: 100%;
    box-shadow: ${shadows.input};
    border: 1px solid ${theme.border.default};
  }

  .DocSearch-Input {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--docsearch-text-color);
    flex: 1;
    font: inherit;
    font-size: 1.2em;
    height: 100%;
    outline: none;
    padding: 0 0 0 8px;
    width: 80%;
  }

  .DocSearch-Input::placeholder {
    color: ${theme.text.secondary};
    opacity: 0.5;
  }

  .DocSearch-Input::selection {
    color: ${theme.palette.white};
  }

  .DocSearch-Input::-webkit-search-cancel-button,
  .DocSearch-Input::-webkit-search-decoration,
  .DocSearch-Input::-webkit-search-results-button,
  .DocSearch-Input::-webkit-search-results-decoration {
    display: none;
  }

  .DocSearch-LoadingIndicator,
  .DocSearch-MagnifierLabel,
  .DocSearch-Reset {
    margin: 0;
    padding: 0;
  }

  .DocSearch-MagnifierLabel,
  .DocSearch-Reset {
    align-items: center;
    color: var(--docsearch-icon-color);
    display: flex;
    justify-content: center;
  }

  .DocSearch-Container--Stalled .DocSearch-MagnifierLabel {
    display: none;
  }

  .DocSearch-LoadingIndicator {
    display: none;
  }

  .DocSearch-Container--Stalled .DocSearch-LoadingIndicator {
    align-items: center;
    color: var(--docsearch-highlight-color);
    display: flex;
    justify-content: center;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    .DocSearch-Reset {
      animation: none;
      appearance: none;
      background: none;
      border: 0;
      border-radius: 50%;
      color: var(--docsearch-icon-color);
      cursor: pointer;
      right: 0;
      stroke-width: var(--docsearch-icon-stroke-width);
    }
  }

  .DocSearch-Reset {
    animation: fade-in 0.1s ease-in forwards;
    appearance: none;
    background: none;
    border: 0;
    border-radius: 50%;
    color: var(--docsearch-icon-color);
    cursor: pointer;
    padding: 2px;
    right: 0;
    stroke-width: var(--docsearch-icon-stroke-width);
  }

  .DocSearch-Reset[hidden] {
    display: none;
  }

  .DocSearch-Reset:focus {
    outline: none;
  }

  .DocSearch-Reset:hover {
    color: var(--docsearch-highlight-color);
  }

  .DocSearch-LoadingIndicator svg,
  .DocSearch-MagnifierLabel svg {
    height: 20px;
    width: 20px;
    margin-right: 2px;
  }

  .DocSearch-Cancel {
    display: none;
  }

  /* Modal Dropdown */

  .DocSearch-Dropdown {
    max-height: calc(
      var(--docsearch-modal-height) - var(--docsearch-searchbox-height) -
        (var(--docsearch-spacing) * 3) - var(--docsearch-footer-height)
    );
    min-height: calc(
      var(--docsearch-modal-height) - var(--docsearch-searchbox-height) -
        (var(--docsearch-spacing) * 3) - var(--docsearch-footer-height)
    );
    overflow-y: auto; /* firefox */
    overflow-y: overlay;
    padding: 0 var(--docsearch-spacing);
    scrollbar-color: var(--docsearch-muted-color) var(--docsearch-modal-background);
    scrollbar-width: thin;
    margin: ${spacing[3]}px 0;
  }

  .DocSearch-Dropdown::-webkit-scrollbar {
    width: 12px;
  }

  .DocSearch-Dropdown::-webkit-scrollbar-track {
    background: transparent;
  }

  .DocSearch-Dropdown::-webkit-scrollbar-thumb {
    background-color: ${theme.background.quaternary};
    border: 3px solid var(--docsearch-modal-background);
    border-radius: 20px;
  }

  .DocSearch-Dropdown ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .DocSearch-Label {
    color: var(--docsearch-muted-color);
    font-size: 0.75em;
    line-height: 2em;
  }

  .DocSearch-Help {
    color: var(--docsearch-muted-color);
    font-size: 0.9em;
    margin: 0;
    user-select: none;
  }

  .DocSearch-Title {
    font-size: 1.2em;
    color: var(--docsearch-text-color);
    user-select: none;
  }

  .DocSearch-Logo a {
    display: flex;
    margin-top: 3px;
  }

  .DocSearch-Logo svg {
    color: var(--docsearch-icon-color);
    margin: 2px 0 0 8px;
  }

  /* Hit */

  .DocSearch-Hits:last-of-type {
    margin-bottom: 24px;
  }

  .DocSearch-Hits mark {
    color: ${theme.palette.primary[900]};
    background: ${theme.palette.primary[100]};
    border-radius: 2px;
  }

  .DocSearch-HitsFooter {
    color: var(--docsearch-muted-color);
    display: flex;
    font-size: 0.85em;
    justify-content: center;
    margin-bottom: var(--docsearch-spacing);
    padding: var(--docsearch-spacing);
    display: none;
  }

  .DocSearch-HitsFooter a {
    border-bottom: 1px solid;
    color: inherit;
  }

  .DocSearch-Hit {
    border-radius: 4px;
    display: flex;
    padding-bottom: 4px;
    position: relative;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    .DocSearch-Hit--deleting {
      transition: none;
    }
  }

  .DocSearch-Hit--deleting {
    opacity: 0;
    transition: all 250ms linear;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    .DocSearch-Hit--favoriting {
      transition: none;
    }
  }

  .DocSearch-Hit--favoriting {
    transform: scale(0);
    transform-origin: top center;
    transition: all 250ms linear;
    transition-delay: 250ms;
  }

  .DocSearch-Hit a {
    background: var(--docsearch-hit-background);
    border-radius: 4px;
    box-shadow: var(--docsearch-hit-shadow);
    display: block;
    padding-left: var(--docsearch-spacing);
    width: 100%;
  }

  .DocSearch-Hit-source {
    background: var(--docsearch-modal-background);
    color: ${theme.text.secondary};
    font-family: ${typography.fontFaces.medium};
    font-size: 0.85em;
    line-height: 32px;
    margin: 0 -4px;
    padding: 8px 4px 0;
    position: sticky;
    top: 0;
    z-index: 10;
    display: none;
  }

  .DocSearch-Hit-Tree {
    color: ${theme.palette.gray[400]};
    height: var(--docsearch-hit-height);
    opacity: 0.5;
    stroke-width: var(--docsearch-icon-stroke-width);
    width: 24px;
  }

  .DocSearch-Hit[aria-selected='true'] .DocSearch-Hit-icon:before {
    filter: brightness(0.75);
  }

  .DocSearch-Hit[aria-selected='true'] a {
    background-color: var(--docsearch-hit-active-color);
  }

  .DocSearch-Hit[aria-selected='true'] mark {
    background: ${theme.palette.primary[200]};
  }

  .DocSearch-Hit-Container {
    align-items: center;
    color: var(--docsearch-hit-color);
    display: flex;
    flex-direction: row;
    height: var(--docsearch-hit-height);
    padding: 0 var(--docsearch-spacing) 0 0;
  }

  .DocSearch-Hit-icon {
    color: var(--docsearch-muted-color);
    height: 20px;
    stroke-width: var(--docsearch-icon-stroke-width);
    width: 20px;
  }

  .DocSearch-Hit-action {
    align-items: center;
    color: var(--docsearch-muted-color);
    display: flex;
    height: 22px;
    stroke-width: var(--docsearch-icon-stroke-width);
    width: 22px;
  }

  .DocSearch-Hit-action svg {
    display: block;
    height: 18px;
    width: 18px;
  }

  .DocSearch-Hit-action + .DocSearch-Hit-action {
    margin-left: 6px;
  }

  .DocSearch-Hit-action-button {
    appearance: none;
    background: none;
    border: 0;
    border-radius: 50%;
    color: inherit;
    cursor: pointer;
    padding: 2px;
  }

  svg.DocSearch-Hit-Select-Icon {
    display: none;
  }

  .DocSearch-Hit[aria-selected='true'] .DocSearch-Hit-Select-Icon {
    display: block;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    .DocSearch-Hit-action-button:hover,
    .DocSearch-Hit-action-button:focus {
      background: ${theme.background.quaternary};
      transition: none;
    }
  }

  .DocSearch-Hit-action-button:hover,
  .DocSearch-Hit-action-button:focus {
    background: ${theme.background.quaternary};
    transition: background-color 0.1s ease-in;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    .DocSearch-Hit-action-button:hover,
    .DocSearch-Hit-action-button:focus {
      transition: none;
    }
  }

  .DocSearch-Hit-action-button:hover path,
  .DocSearch-Hit-action-button:focus path {
    fill: ${theme.palette.primary[400]};
    stroke: ${theme.palette.primary[400]};
  }

  .DocSearch-Hit-content-wrapper {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    font-weight: 500;
    justify-content: center;
    line-height: 1.2em;
    margin: 0 8px 0 12px;
    overflow-x: hidden;
    position: relative;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%;
  }

  .DocSearch-Hit-title {
    font-size: 0.9em;
    font-family: ${typography.fontFaces.medium};
    color: ${theme.text.default};
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .DocSearch-Hit-path {
    color: var(--docsearch-muted-color);
    font-size: 0.75em;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    .DocSearch-Hit-action-button:hover,
    .DocSearch-Hit-action-button:focus {
      background: ${theme.background.quaternary};
      transition: none;
    }
  }

  /* No Results - Start Screen - Error Screen */

  .DocSearch-NoResults,
  .DocSearch-StartScreen,
  .DocSearch-ErrorScreen {
    margin: 0 auto;
    padding: 36px 0;
    text-align: center;
    width: 80%;
  }

  .DocSearch-Screen-Icon {
    color: var(--docsearch-muted-color);
    padding-bottom: 12px;
  }

  .DocSearch-NoResults-Prefill-List {
    display: inline-block;
    margin-top: ${spacing[4]}px;
    padding: ${spacing[6]}px 0;
    text-align: left;
    min-width: 50%;
  }

  .DocSearch-NoResults-Prefill-List ul {
    display: inline-block;
    padding: 8px 0 0;
  }

  .DocSearch-NoResults-Prefill-List li {
    list-style-position: inside;
    list-style-type: '» ';
    padding: ${spacing[1]}px 0;
    color: var(--docsearch-muted-color);
  }

  .DocSearch-Prefill {
    appearance: none;
    background: none;
    border: 0;
    border-radius: 1em;
    color: ${theme.link.default};
    cursor: pointer;
    display: inline-block;
    font-size: 1em;
    padding: 0;
  }

  .DocSearch-Prefill:hover,
  .DocSearch-Prefill:focus {
    outline: none;
    text-decoration: underline;
  }

  /* Modal Footer */

  .DocSearch-Footer {
    align-items: center;
    border-top: 1px solid ${theme.border.default};
    border-radius: 0 0 8px 8px;
    box-shadow: var(--docsearch-footer-shadow);
    display: flex;
    flex-direction: row-reverse;
    flex-shrink: 0;
    height: var(--docsearch-footer-height);
    justify-content: space-between;
    padding: 0 var(--docsearch-spacing) 1px;
    position: relative;
    user-select: none;
    width: 100%;
    z-index: 300;
  }

  .DocSearch-Commands {
    color: var(--docsearch-muted-color);
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .DocSearch-Commands li {
    align-items: center;
    display: flex;
  }

  .DocSearch-Commands li:not(:last-of-type) {
    margin-right: 0.8em;
  }

  .DocSearch-Commands-Key {
    display: flex;
    align-items: center;
    height: 20px;
    ${typography.utility.pre}
    ${kbdStyle}
    margin: 0 0.4em 0 0;
    padding: 0 2px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    :root {
      --docsearch-spacing: 10px;
      --docsearch-footer-height: 40px;
      --docsearch-searchbox-height: 40px;
    }

    .DocSearch-MagnifierLabel svg {
      height: 18px;
      width: 18px;
    }

    .DocSearch-Dropdown {
      height: 100%;
    }

    .DocSearch-Button {
      background: ${theme.background.default};
      margin: 0;
    }

    .DocSearch-Container {
      height: 100vh;
      height: -webkit-fill-available;
      position: absolute;
    }

    .DocSearch-Footer {
      border-radius: 0;
      bottom: 0;
      position: absolute;
    }

    .DocSearch-Hit-content-wrapper {
      display: flex;
      position: relative;
      width: 80%;
    }

    .DocSearch-Hit-title {
      font-size: 0.9rem;
    }

    .DocSearch-Hit-path {
      font-size: 0.75rem;
    }

    .DocSearch-Modal {
      border-radius: 0;
      box-shadow: none;
      height: 100vh;
      height: -webkit-fill-available;
      margin: 0;
      max-width: 100%;
      width: 100%;
      min-width: auto;
    }

    .DocSearch-Dropdown {
      max-height: calc(
        100vh - var(--docsearch-searchbox-height) - (var(--docsearch-spacing) * 4) -
          var(--docsearch-footer-height)
      );
    }

    .DocSearch-Cancel {
      appearance: none;
      background: none;
      border: 0;
      color: var(--docsearch-highlight-color);
      cursor: pointer;
      display: inline-block;
      flex: none;
      font: inherit;
      font-size: 1em;
      font-weight: 500;
      margin-left: var(--docsearch-spacing);
      outline: none;
      overflow: hidden;
      padding: 0 4px 0 2px;
      user-select: none;
      white-space: nowrap;
    }

    .DocSearch-Commands,
    .DocSearch-Hit-Tree {
      display: none;
    }

    .DocSearch-Form {
      height: 38px;
    }

    .DocSearch-SearchBar {
      padding-bottom: ${spacing[2.5]}px;
    }

    .DocSearch-Logo svg {
      margin-top: 0;
    }
  }

  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  /* === Expo Icons === */

  .DocSearch-Hit:not(.DocSearch-Hit--Child) a .DocSearch-Hit-icon svg {
    display: none;
  }

  /* Guides/Generic Icon */
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a .DocSearch-Hit-icon:before {
    content: '';
    width: 18px;
    height: 18px;
    display: block;
    color: ${theme.icon.secondary};
    background-size: cover;
    background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIuNjY2NzUgMTIuOTk5OUMyLjY2Njc1IDEyLjU1NzkgMi44NDIzNCAxMi4xMzQgMy4xNTQ5IDExLjgyMTRDMy40Njc0NiAxMS41MDg4IDMuODkxMzkgMTEuMzMzMyA0LjMzMzQxIDExLjMzMzNIMTMuMzMzNCIgc3Ryb2tlPSIjOTY5ZmFmIiBzdHJva2Utd2lkdGg9IjEuNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L3BhdGg+CjxwYXRoIGQ9Ik00LjMzMzQxIDEuMzMzMjVIMTMuMzMzNFYxNC42NjY2SDQuMzMzNDFDMy44OTEzOSAxNC42NjY2IDMuNDY3NDYgMTQuNDkxIDMuMTU0OSAxNC4xNzg0QzIuODQyMzQgMTMuODY1OSAyLjY2Njc1IDEzLjQ0MTkgMi42NjY3NSAxMi45OTk5VjIuOTk5OTJDMi42NjY3NSAyLjU1Nzg5IDIuODQyMzQgMi4xMzM5NyAzLjE1NDkgMS44MjE0MUMzLjQ2NzQ2IDEuNTA4ODUgMy44OTEzOSAxLjMzMzI1IDQuMzMzNDEgMS4zMzMyNVYxLjMzMzI1WiIgc3Ryb2tlPSIjOTY5ZmFmIiBzdHJva2Utd2lkdGg9IjEuNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L3BhdGg+Cjwvc3ZnPg==);
  }

  /* API Reference/Versioned Icon */
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/versions/'] .DocSearch-Hit-icon:before {
    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNS4yLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCAxNi45IDE4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxNi45IDE4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojOTY5RkFGO30NCgkuc3Qxe2ZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6Izk2OUZBRjt9DQo8L3N0eWxlPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTEwLjMsNy4yYzAsMCwwLjEsMCwwLjIsMGw0LjgsMy43YzAsMCwwLjEsMC4xLDAsMC4yTDE1LDEyLjNjMCwwLDAsMC4xLTAuMSwwLjFjMCwwLTAuMSwwLTAuMSwwbC00LTIuNQ0KCWwtMC44LDQuOWMwLDAsMCwwLjEtMC4xLDAuMWMwLDAtMC4xLDAtMC4xLDBsLTEtMC41Yy0wLjEsMC0wLjEtMC4xLTAuMS0wLjFsMC40LTYuNGMwLDAsMC0wLjEsMC4xLTAuMUwxMC4zLDcuMnoiLz4NCjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik04LjEsMEM4LDAsOCwwLDcuOSwwTDAuMSw0LjZsMCwwQzAsNC42LDAsNC42LDAsNC43bDAsMHY5LjFjMCwwLjEsMCwwLjEsMC4xLDAuMWwxLjUsMC45bDAsMGMwLDAsMC4xLDAsMC4xLDANCglsMC45LTAuNXYxLjFjMCwwLjEsMCwwLjEsMC4xLDAuMWwxLjUsMC45YzAsMCwwLjEsMCwwLjEsMGwwLDBsMS44LTEuMWwwLjgsMi42YzAsMCwwLDAuMSwwLjEsMC4xYzAsMCwwLjEsMCwwLjEsMGwxLjYtMC41DQoJYzAsMCwwLDAsMCwwbDcuOS00LjJjMC4xLDAsMC4xLTAuMSwwLjEtMC4ybC0zLTkuMmMwLDAsMC0wLjEtMC4xLTAuMWMwLDAsMCwwLTAuMSwwYzAsMCwwLDAtMC4xLDBsLTEuMywwLjVWMi42DQoJYzAtMC4xLDAtMC4xLTAuMS0wLjFsMCwwbC0xLjUtMC45YzAsMC0wLjEsMC0wLjEsMEw5LjcsMi4xVjF2MGMwLTAuMSwwLTAuMS0wLjEtMC4xTDguMSwweiBNNC40LDguNmwwLTEuNEwzLjEsNi41djguNmwxLjMsMC43DQoJTDQuNCw4LjZDNC40LDguNyw0LjQsOC43LDQuNCw4LjZDNC40LDguNyw0LjQsOC43LDQuNCw4LjZ6IE0wLjUsNWwxLjIsMC43bDAsOC43bC0xLjItMC43VjV6IE05LjMsMS4xTDgsMC40TDAuNyw0LjZsMS4yLDAuNw0KCUw5LjMsMS4xeiBNNC42LDYuOUwxMiwyLjdMMTAuNywyTDMuNCw2LjJMNC42LDYuOXogTTksMTYuOUw2LjIsOC4xbDcuNC00bDIuOCw4LjhMOSwxNi45eiBNNC42LDguN2wyLjcsOC44bDEuMy0wLjRMNS44LDguMw0KCUw0LjYsOC43eiIvPg0KPC9zdmc+DQo=);
  }

  /* EAS Icon */
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/app-signing/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/build/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/build-reference/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/development/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/eas/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/eas/metadata/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/eas-update/'] .DocSearch-Hit-icon:before,
  .DocSearch-Hit:not(.DocSearch-Hit--Child) a[href*='/submit/'] .DocSearch-Hit-icon:before {
    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNS4yLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCAxNCAxNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTQgMTQ7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQoJLnN0MHtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOiM5NjlGQUY7fQ0KPC9zdHlsZT4NCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik03LjcsMS4zYy0wLjMtMC41LTEtMC41LTEuMywwTDAuMSwxMmMtMC4zLDAuNSwwLjEsMS4xLDAuNywxLjFoMTIuNWMwLjYsMCwwLjktMC42LDAuNy0xLjFMNy43LDEuM3oNCgkgTTEyLjQsMTEuOGwtMS41LTIuNEgzbC0xLjUsMi40SDEyLjR6IE05LjEsNi4zbDEuNCwyLjJoLTdsMS40LTIuMkg5LjF6IE04LjcsNS41TDcsMi43TDUuMyw1LjVIOC43eiIvPg0KPC9zdmc+DQo=);
  }
`;
