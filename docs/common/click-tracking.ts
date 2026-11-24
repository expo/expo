import { reportDocsClick } from '~/providers/Analytics';

const TRACKED_PATHS = new Set([
  '/eas/',
  '/eas/workflows/introduction/',
  '/build/introduction/',
  '/eas/hosting/introduction/',
  '/eas-update/introduction/',
  '/eas/observe/introduction/',
  '/eas/simulators/introduction/',
  '/eas/metadata/',
  '/eas-insights/introduction/',
]);

export function getLinkText(control: HTMLElement) {
  const terminalCommands = control.closest<HTMLElement>('[data-md="terminal"]')?.dataset.mdCommands;
  if (terminalCommands) {
    return Object.values(JSON.parse(terminalCommands)).flat().join(' ');
  }
  return control.getAttribute('aria-label') ?? control.innerText.trim().split('\n')[0];
}

function getHeadingAbove(control: Element, main: Element) {
  let section = 'main';
  for (const heading of main.querySelectorAll('h2[id]')) {
    if (!(heading.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      break;
    }
    section = heading.id;
  }
  return section;
}

function getSection(control: HTMLElement) {
  if (control.closest('[data-toc]')) {
    return 'toc';
  }
  const main = control.closest('main');
  if (main) {
    return getHeadingAbove(control, main);
  }
  return control.closest('header, footer')?.localName ?? 'sidebar';
}

function withoutQuery(href: string) {
  const url = new URL(href);
  url.search = '';
  return url.href;
}

export function trackServicesPageClick(event: MouseEvent) {
  const { origin, pathname } = window.location;
  if (!TRACKED_PATHS.has(pathname)) {
    return;
  }
  const control = (event.target as Element).closest<HTMLElement>('a[href], button');
  if (!control) {
    return;
  }
  const params = {
    section: getSection(control),
    link_text: getLinkText(control),
    page_location: origin + pathname,
  };
  reportDocsClick(
    control instanceof HTMLAnchorElement
      ? { ...params, link_url: withoutQuery(control.href) }
      : params
  );
}
