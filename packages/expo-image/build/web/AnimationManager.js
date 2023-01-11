import React from 'react';
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
export function getAnimatorFromClass(animationClass, timingFunction) {
    if (!animationClass)
        return null;
    const timingClass = `image-timing-${validateTimingFunctionForAnimation(animationClass, timingFunction)}`;
    return {
        startingClass: `${animationClass}-start`,
        animateInClass: [animationClass, 'transitioning', `${animationClass}-active`, timingClass].join(' '),
        animateOutClass: [animationClass, `${animationClass}-end`, 'unmount', timingClass].join(' '),
        containerClass: `${animationClass}-container`,
        timingFunction,
        animationClass,
    };
}
export default function AnimationManager({ children: renderFunction, initial, animation, }) {
    const initialNode = useAnimationManagerNode(initial, 'active');
    const [nodes, setNodes] = React.useState(initialNode ? [initialNode] : []);
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
                const copy = [...n];
                copy.splice(existingNodeIndex, 1, newNode);
                return copy;
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
            });
        }
        if (initial?.[0] === node.animationKey) {
            return initial[1]({
                onAnimationFinished: () => {
                    if (node.status === 'out') {
                        removeAllNodesOfKeyExceptShowing(node.animationKey);
                    }
                },
            });
        }
        return node.persistedElement({
            onAnimationFinished: () => {
                removeAllNodesOfKeyExceptShowing(node.animationKey);
            },
        });
    }
    return (React.createElement(React.Fragment, null, [...nodes].map((n, idx) => (React.createElement("div", { className: animation?.containerClass, key: n.animationKey }, wrapNodeWithCallbacks(n)({
        in: animation?.animateInClass,
        out: animation?.animateOutClass,
        mounted: animation?.startingClass,
    }[n.status]))))));
}
//# sourceMappingURL=AnimationManager.js.map