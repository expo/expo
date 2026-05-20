import { ReactElementNode } from './jsx-runtime-stub';

export function decorateInteractiveTargets(node: unknown) {
  return decorateNode(node, {
    nearestParentKey: null,
    nextTargetIndex: {
      current: 0,
    },
    typesToDecorate: ['Button'],
  });
}

function decorateNode(
  node: unknown,
  context: {
    nearestParentKey: string | null;
    nextTargetIndex: {
      current: number;
    };
    typesToDecorate: string[];
  }
): unknown {
  if (Array.isArray(node)) {
    return node.map((child) => decorateNode(child, context));
  }

  if (!isReactElementNode(node)) {
    return node;
  }

  const props = node.props ?? {};

  if (props.target == null && context.typesToDecorate.includes(node.type as string)) {
    props.target = buildButtonTargetId(context.nextTargetIndex.current, context.nearestParentKey);
    context.nextTargetIndex.current += 1;
  }

  if ('children' in props) {
    props.children = decorateNode(props.children, {
      nearestParentKey: node.key ?? context.nearestParentKey,
      nextTargetIndex: context.nextTargetIndex,
      typesToDecorate: context.typesToDecorate,
    });
  }

  return node;
}

function isReactElementNode(node: unknown): node is ReactElementNode {
  return Boolean(node) && typeof node === 'object' && 'type' in node && 'props' in node;
}

function buildButtonTargetId(index: number, parentKey: string | null) {
  const baseTarget = `__expo_widgets_target_${index}`;

  if (!parentKey) {
    return baseTarget;
  }

  return `${baseTarget}_${parentKey}`;
}
