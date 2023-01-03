import React from 'react';
function setClassOnElement(element, classes) {
    if (!element) {
        return;
    }
    element.setAttribute('class', classes.join(' '));
}
function useAnimationManagerNode(node) {
    const callbackContainer = {
        onReady: null,
        onAnimationFinished: null,
        onMount: null,
    };
    const newNode = React.useMemo(() => {
        if (!node) {
            return null;
        }
        const [animationKey, renderFunction] = node;
        const ref = React.createRef();
        const child = renderFunction({
            onReady: () => {
                callbackContainer.onReady?.();
            },
            onAnimationFinished: () => {
                callbackContainer.onAnimationFinished?.();
            },
            onMount: () => {
                callbackContainer.onMount?.();
            },
            ref,
        });
        // key, ReactElement, ref, callbacks
        return { animationKey, child, ref, callbackContainer };
    }, [node?.[1]]);
    return newNode;
}
export function getAnimatorFromClass(animationClass) {
    if (!animationClass)
        return null;
    const runAnimation = (to, from) => {
        setClassOnElement(to.current, [animationClass, 'transitioning', `${animationClass}-active`]);
        from.forEach((element) => {
            if (!element.current?.classList.contains(`unmount`)) {
                setClassOnElement(element.current, [animationClass, `${animationClass}-end`, 'unmount']);
            }
        });
    };
    return {
        startingClass: `${animationClass}-start`,
        run: runAnimation,
    };
}
export default function AnimationManager({ children: renderFunction, initial, animation, }) {
    const initialNode = useAnimationManagerNode(initial);
    if (initialNode) {
        initialNode.callbackContainer.onAnimationFinished = () => setNodes((n) => n.filter((node, index) => node.animationKey !== initialNode.animationKey || index === n.length - 1));
    }
    const [nodes, setNodes] = React.useState(initialNode ? [initialNode] : []);
    const newNode = useAnimationManagerNode(renderFunction);
    if (newNode) {
        newNode.callbackContainer.onAnimationFinished = (forceUnmount = false) => {
            if (newNode.ref.current?.classList.contains('unmount') || forceUnmount) {
                setNodes((n) => n.filter((node, index) => node.animationKey !== newNode.animationKey || index === n.length - 1));
            }
        };
    }
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
            newNode.callbackContainer.onMount = () => {
                if (!newNode?.ref.current || !animation?.startingClass) {
                    return;
                }
                if (!newNode?.ref.current.classList.contains('transitioning')) {
                    setClassOnElement(newNode?.ref.current, [animation?.startingClass]);
                }
            };
            newNode.callbackContainer.onReady = () => {
                if (animation) {
                    animation.run(newNode.ref, n.map((n2) => n2.ref));
                }
                else {
                    n.forEach((oldNode) => oldNode.callbackContainer?.onAnimationFinished?.(true));
                }
            };
            n.forEach((prevNode) => (prevNode.callbackContainer.onReady = () => null));
            return [...n, newNode];
        });
    }, [newNode]);
    return (React.createElement(React.Fragment, null, [...nodes].reverse().map((n, idx) => (React.createElement("div", { key: n.animationKey }, n.child)))));
}
//# sourceMappingURL=AnimationManager.js.map