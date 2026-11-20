import { arrow, autoUpdate, computePosition, flip, hide, offset, shift } from '@floating-ui/dom';
import { useEffect } from 'react';

const ANNOTATION_SELECTOR = '.with-tooltip';
const TOOLTIP_ID = 'code-annotation-tooltip';
const DISTANCE_FROM_ANNOTATION = 8;
const VIEWPORT_PADDING = 5;
const HIDE_DELAY_MS = 100;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const ARROW_PATH =
  'M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z';

let mountedCodeBlocks = 0;
let removeTooltip: (() => void) | undefined;

export function useCodeAnnotationTooltip() {
  useEffect(() => {
    mountedCodeBlocks += 1;
    if (mountedCodeBlocks === 1) {
      removeTooltip = addTooltip();
    }
    return () => {
      mountedCodeBlocks -= 1;
      if (mountedCodeBlocks === 0) {
        removeTooltip?.();
        removeTooltip = undefined;
      }
    };
  }, []);
}

function buildTooltipContent(raw: string): HTMLSpanElement {
  const wrapper = document.createElement('span');
  const parts = raw.split(/(`[^`]+`|\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (!part) {
      continue;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = document.createElement('code');
      code.textContent = part.slice(1, -1);
      wrapper.appendChild(code);
    } else if (part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      wrapper.appendChild(strong);
    } else {
      wrapper.appendChild(document.createTextNode(part));
    }
  }
  return wrapper;
}

function fitWidthToText(content: HTMLElement) {
  content.style.width = '';
  const range = document.createRange();
  range.selectNodeContents(content);
  const rects = [...range.getClientRects()];
  if (rects.length === 0) {
    return;
  }
  const textWidth =
    Math.max(...rects.map(rect => rect.right)) - Math.min(...rects.map(rect => rect.left));
  const style = getComputedStyle(content);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  content.style.width = `${Math.ceil(textWidth + padding)}px`;
}

function roundToDevicePixel(value: number) {
  const ratio = window.devicePixelRatio || 1;
  return Math.round(value * ratio) / ratio;
}

function createArrow() {
  const path = document.createElementNS(SVG_NAMESPACE, 'path');
  path.setAttribute('d', ARROW_PATH);
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '6');
  svg.setAttribute('viewBox', '0 0 16 6');
  svg.setAttribute('aria-hidden', 'true');
  svg.append(path);
  const arrowElement = document.createElement('div');
  arrowElement.className = 'code-annotation-tooltip-arrow';
  arrowElement.append(svg);
  return arrowElement;
}

function addTooltip() {
  const content = document.createElement('div');
  content.className = 'code-annotation-tooltip-content';
  const arrowElement = createArrow();
  const box = document.createElement('div');
  box.className = 'code-annotation-tooltip-box';
  box.append(content, arrowElement);
  const tooltip = document.createElement('div');
  tooltip.id = TOOLTIP_ID;
  tooltip.className = 'code-annotation-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.dataset.state = 'hidden';
  tooltip.append(box);
  document.body.append(tooltip);

  let annotation: HTMLElement | null = null;
  let pinnedByKeyboard = false;
  let stopAutoUpdate: (() => void) | undefined;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  async function updatePositionAsync(target: HTMLElement) {
    if (!target.isConnected) {
      hideNow();
      return;
    }
    const { x, y, placement, middlewareData } = await computePosition(target, tooltip, {
      strategy: 'fixed',
      placement: 'top',
      middleware: [
        offset(DISTANCE_FROM_ANNOTATION),
        flip({ padding: VIEWPORT_PADDING }),
        shift({ padding: VIEWPORT_PADDING }),
        arrow({ element: arrowElement }),
        hide(),
      ],
    });
    if (target !== annotation) {
      return;
    }
    tooltip.style.transform = `translate(${roundToDevicePixel(x)}px, ${roundToDevicePixel(y)}px)`;
    tooltip.dataset.placement = placement;
    tooltip.dataset.referenceHidden = String(Boolean(middlewareData.hide?.referenceHidden));
    arrowElement.style.left = `${middlewareData.arrow?.x ?? 0}px`;
    tooltip.dataset.state = 'visible';
  }

  function detach() {
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
    annotation?.removeAttribute('aria-describedby');
    annotation = null;
    pinnedByKeyboard = false;
  }

  function show(target: HTMLElement) {
    clearTimeout(hideTimeout);
    if (target === annotation) {
      return;
    }
    detach();
    annotation = target;
    annotation.setAttribute('aria-describedby', TOOLTIP_ID);
    content.replaceChildren(buildTooltipContent(target.dataset.tooltip ?? ''));
    fitWidthToText(content);
    stopAutoUpdate = autoUpdate(target, tooltip, () => void updatePositionAsync(target));
  }

  function hideNow() {
    clearTimeout(hideTimeout);
    detach();
    tooltip.dataset.state = 'hidden';
  }

  function scheduleHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideNow, HIDE_DELAY_MS);
  }

  function isInsideAnnotationOrTooltip(node: EventTarget | null) {
    if (!(node instanceof Node)) {
      return false;
    }
    return tooltip.contains(node) || annotation?.contains(node) === true;
  }

  function onMouseOver(event: MouseEvent) {
    if (annotation && !annotation.isConnected) {
      hideNow();
    }
    if (!(event.target instanceof Element)) {
      return;
    }
    if (tooltip.contains(event.target)) {
      clearTimeout(hideTimeout);
      return;
    }
    const target = event.target.closest(ANNOTATION_SELECTOR);
    if (target instanceof HTMLElement) {
      show(target);
    }
  }

  function onMouseOut(event: MouseEvent) {
    if (
      annotation &&
      !pinnedByKeyboard &&
      isInsideAnnotationOrTooltip(event.target) &&
      !isInsideAnnotationOrTooltip(event.relatedTarget)
    ) {
      scheduleHide();
    }
  }

  function onFocusIn(event: FocusEvent) {
    if (event.target instanceof HTMLElement && event.target.matches(ANNOTATION_SELECTOR)) {
      show(event.target);
      pinnedByKeyboard = event.target.matches(':focus-visible');
    }
  }

  function onFocusOut(event: FocusEvent) {
    if (event.target === annotation) {
      hideNow();
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && annotation) {
      hideNow();
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (annotation && !isInsideAnnotationOrTooltip(event.target)) {
      hideNow();
    }
  }

  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout', onMouseOut);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onPointerDown);

  return () => {
    document.removeEventListener('mouseover', onMouseOver);
    document.removeEventListener('mouseout', onMouseOut);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onPointerDown);
    hideNow();
    tooltip.remove();
  };
}
