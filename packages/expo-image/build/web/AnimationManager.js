import React from 'react';
const SUPPORTED_ANIMATIONS = [
    'cross-dissolve',
    'flip-from-left',
    'flip-from-right',
    'flip-from-top',
    'flip-from-bottom',
];
function useAnimationManagerNode(node, initialStatus) {
    const newNode = React.useMemo(() => {
        if (!node) {
            return null;
        }
        const [animationKey, renderFunction] = node;
        // key, ReactElement, ref, callbacks
        return {
            animationKey,
            persistedElement: renderFunction,
            status: (initialStatus || 'mounted'),
        };
    }, [node?.[0]]);
    return newNode;
}
function validateTimingFunctionForAnimation(animationClass, timingFunction) {
    if (animationClass?.includes('flip')) {
        if (timingFunction?.includes('ease')) {
            return 'ease-in-out';
        }
        return 'linear';
    }
    return timingFunction || null;
}
function validateAnimationClass(effect) {
    if (SUPPORTED_ANIMATIONS.includes(effect)) {
        return effect;
    }
    return 'cross-dissolve';
}
export function getAnimatorFromTransition(transition) {
    if (!transition?.duration) {
        return null;
    }
    const animationClass = validateAnimationClass(transition.effect);
    if (!animationClass) {
        return {
            startingClass: '',
            animateInClass: '',
            animateOutClass: '',
            containerClass: '',
            timingFunction: 'linear',
            animationClass: '',
            duration: 0,
        };
    }
    const timingFunction = validateTimingFunctionForAnimation(animationClass, transition.timing);
    const timingClass = `image-timing-${timingFunction}`;
    return {
        startingClass: `${animationClass}-start`,
        animateInClass: [animationClass, 'transitioning', `${animationClass}-active`, timingClass].join(' '),
        animateOutClass: [animationClass, `${animationClass}-end`, timingClass].join(' '),
        containerClass: `${animationClass}-container`,
        timingFunction,
        animationClass,
        duration: transition?.duration || 0,
    };
}
export default function AnimationManager({ children: renderFunction, initial, transition, recyclingKey, }) {
    const animation = getAnimatorFromTransition(transition);
    const initialNode = useAnimationManagerNode(initial, 'active');
    const [nodes, setNodes] = React.useState(initialNode ? [initialNode] : []);
    const [prevRecyclingKey, setPrevRecyclingKey] = React.useState(recyclingKey ?? '');
    if (prevRecyclingKey !== (recyclingKey ?? '')) {
        setPrevRecyclingKey(recyclingKey ?? '');
        setNodes(initialNode ? [initialNode] : []);
    }
    const removeAllNodesOfKeyExceptShowing = (key) => {
        setNodes((n) => n.filter((node) => (key ? node.animationKey !== key : false) ||
            node.status === 'in' ||
            node.status === 'active'));
    };
    const newNode = useAnimationManagerNode(renderFunction);
    React.useEffect(() => {
        setNodes((n) => {
            if (!newNode) {
                return n;
            }
            const existingNodeIndex = n.findIndex((node) => node.animationKey === newNode.animationKey);
            if (existingNodeIndex >= 0) {
                if (animation) {
                    return n.map((n2) => n2.animationKey === newNode.animationKey
                        ? { ...newNode, status: 'in' }
                        : { ...n2, status: 'out' });
                }
                else {
                    return [{ ...newNode, status: 'in' }];
                }
            }
            return [...n, newNode];
        });
    }, [newNode]);
    function wrapNodeWithCallbacks(node) {
        if (renderFunction[0] === node.animationKey) {
            return renderFunction[1]({
                onReady: () => {
                    if (animation) {
                        setNodes((nodes) => nodes.map((n) => (n === newNode ? { ...n, status: 'in' } : { ...n, status: 'out' })));
                    }
                    else {
                        setNodes([{ ...node, status: 'in' }]);
                    }
                },
                onAnimationFinished: () => {
                    setNodes([{ ...node, status: 'in' }]);
                },
                onError: () => {
                    setNodes((nodes) => nodes.map((n) => (n === node ? { ...n, status: 'errored' } : n)));
                },
            });
        }
        if (initial?.[0] === node.animationKey) {
            return initial[1]({
                onAnimationFinished: () => {
                    if (node.status === 'out') {
                        removeAllNodesOfKeyExceptShowing(node.animationKey);
                    }
                },
                onError: () => {
                    setNodes((nodes) => nodes.map((n) => (n === node ? { ...n, status: 'errored' } : n)));
                },
            });
        }
        return node.persistedElement({
            onAnimationFinished: () => {
                removeAllNodesOfKeyExceptShowing(node.animationKey);
            },
        });
    }
    const styles = {
        transitionDuration: `${animation?.duration || 0}ms`,
        transitionTimingFunction: animation?.timingFunction || 'linear',
    };
    const classes = {
        in: animation?.animateInClass,
        out: animation?.animateOutClass,
        mounted: animation?.startingClass,
    };
    return (<>
      {[...nodes]
            .filter((n) => n.status !== 'errored')
            .map((n) => (<div className={animation?.containerClass} key={n.animationKey}>
            {wrapNodeWithCallbacks(n)(classes[n.status], styles)}
          </div>))}
    </>);
}
//# sourceMappingURL=AnimationManager.js.map