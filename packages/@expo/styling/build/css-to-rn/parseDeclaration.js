import { exhaustiveCheck } from './utils';
export function parseDeclaration(declaration, options) {
    const { addStyleProp, addAnimationProp, addContainerProp, addTransitionProp } = options;
    if (declaration.property === 'unparsed') {
        return addStyleProp(declaration.value.propertyId.property, parseUnparsed(declaration.value.value, options));
    }
    else if (declaration.property === 'custom') {
        return addStyleProp(declaration.value.name, parseUnparsed(declaration.value.value, options));
    }
    switch (declaration.property) {
        case 'background-color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'background-image':
            return;
        case 'background-position-x':
            return;
        case 'background-position-y':
            return;
        case 'background-position':
            return;
        case 'background-size':
            return;
        case 'background-repeat':
            return;
        case 'background-attachment':
            return;
        case 'background-clip':
            return;
        case 'background-origin':
            return;
        case 'background':
            return;
        case 'box-shadow':
            return;
        case 'opacity':
            return addStyleProp(declaration.property, declaration.value);
        case 'color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'display':
            if (declaration.value.type === 'keyword' && declaration.value.value === 'none') {
                addStyleProp(declaration.property, declaration.value.value);
            }
            else if (declaration.value.type === 'pair' && declaration.value.inside.type === 'flex') {
                addStyleProp(declaration.property, declaration.value.inside.type);
            }
            return;
        case 'visibility':
            // Might be possible to polyfill this with opacity 0 and to disable event handlers
            return;
        case 'width':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'height':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'min-width':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'min-height':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'max-width':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'max-height':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'block-size':
            return addStyleProp('width', parseSize(declaration.value, options));
        case 'inline-size':
            return addStyleProp('height', parseSize(declaration.value, options));
        case 'min-block-size':
            return addStyleProp('min-width', parseSize(declaration.value, options));
        case 'min-inline-size':
            return addStyleProp('min-height', parseSize(declaration.value, options));
        case 'max-block-size':
            return addStyleProp('max-width', parseSize(declaration.value, options));
        case 'max-inline-size':
            return addStyleProp('max-height', parseSize(declaration.value, options));
        case 'box-sizing':
            return;
        case 'overflow':
            return addStyleProp(declaration.property, parseOverflow(declaration.value.x));
        case 'overflow-x':
            return;
        case 'overflow-y':
            return;
        case 'text-overflow':
            return;
        case 'position':
            // Position works differently on web and native
            return;
        case 'top':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'bottom':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'left':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'right':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'inset-block-start':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'inset-block-end':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'inset-inline-start':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'inset-inline-end':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'inset-block':
            addStyleProp('inset-block-start', parseLengthPercentageOrAuto(declaration.value.blockStart, options), { shortHand: true });
            addStyleProp('inset-block-end', parseLengthPercentageOrAuto(declaration.value.blockEnd, options), { shortHand: true });
            return;
        case 'inset-inline':
            addStyleProp('inset-block-start', parseLengthPercentageOrAuto(declaration.value.inlineStart, options), { shortHand: true });
            addStyleProp('inset-block-end', parseLengthPercentageOrAuto(declaration.value.inlineEnd, options), { shortHand: true });
            return;
        case 'inset':
            addStyleProp('top', parseLengthPercentageOrAuto(declaration.value.top, options), {
                shortHand: true,
            });
            addStyleProp('bottom', parseLengthPercentageOrAuto(declaration.value.bottom, options), {
                shortHand: true,
            });
            addStyleProp('left', parseLengthPercentageOrAuto(declaration.value.left, options), {
                shortHand: true,
            });
            addStyleProp('right', parseLengthPercentageOrAuto(declaration.value.right, options), {
                shortHand: true,
            });
            return;
        case 'border-spacing':
            return;
        case 'border-top-color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'border-bottom-color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'border-left-color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'border-right-color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'border-block-start-color':
            return addStyleProp('border-top-color', parseColor(declaration.value));
        case 'border-block-end-color':
            return addStyleProp('border-bottom-color', parseColor(declaration.value));
        case 'border-inline-start-color':
            return addStyleProp('border-left-color', parseColor(declaration.value));
        case 'border-inline-end-color':
            return addStyleProp('border-right-color', parseColor(declaration.value));
        case 'border-top-style':
            return;
        case 'border-bottom-style':
            return;
        case 'border-left-style':
            return;
        case 'border-right-style':
            return;
        case 'border-block-start-style':
            return;
        case 'border-block-end-style':
            return;
        case 'border-inline-start-style':
            return;
        case 'border-inline-end-style':
            return;
        case 'border-top-width':
            return addStyleProp(declaration.property, parseBorderSideWidth(declaration.value, options));
        case 'border-bottom-width':
            return addStyleProp(declaration.property, parseBorderSideWidth(declaration.value, options));
        case 'border-left-width':
            return addStyleProp(declaration.property, parseBorderSideWidth(declaration.value, options));
        case 'border-right-width':
            return addStyleProp(declaration.property, parseBorderSideWidth(declaration.value, options));
        case 'border-block-start-width':
            return addStyleProp('border-top-width', parseBorderSideWidth(declaration.value, options));
        case 'border-block-end-width':
            return addStyleProp('border-bottom-width', parseBorderSideWidth(declaration.value, options));
        case 'border-inline-start-width':
            return addStyleProp('border-left-width', parseBorderSideWidth(declaration.value, options));
        case 'border-inline-end-width':
            return addStyleProp('border-right-width', parseBorderSideWidth(declaration.value, options));
        case 'border-top-left-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-top-right-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-bottom-left-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-bottom-right-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-start-start-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-start-end-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-end-start-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-end-end-radius':
            return addStyleProp(declaration.property, parseLength(declaration.value[0], options));
        case 'border-radius':
            addStyleProp('border-bottom-left-radius', parseLength(declaration.value.bottomLeft[0], options), { shortHand: true });
            addStyleProp('border-bottom-right-radius', parseLength(declaration.value.bottomRight[0], options), { shortHand: true });
            addStyleProp('border-top-left-radius', parseLength(declaration.value.topLeft[0], options), {
                shortHand: true,
            });
            addStyleProp('border-top-right-radius', parseLength(declaration.value.topRight[0], options), {
                shortHand: true,
            });
            return;
        case 'border-image-source':
            return;
        case 'border-image-outset':
            return;
        case 'border-image-repeat':
            return;
        case 'border-image-width':
            return;
        case 'border-image-slice':
            return;
        case 'border-image':
            return;
        case 'border-color':
            addStyleProp('border-top-color', parseColor(declaration.value.top), {
                shortHand: true,
            });
            addStyleProp('border-bottom-color', parseColor(declaration.value.bottom), {
                shortHand: true,
            });
            addStyleProp('border-left-color', parseColor(declaration.value.left), {
                shortHand: true,
            });
            addStyleProp('border-right-color', parseColor(declaration.value.right), {
                shortHand: true,
            });
            return;
        case 'border-style':
            return addStyleProp(declaration.property, parseBorderStyle(declaration.value));
        case 'border-width':
            addStyleProp('border-top-width', parseBorderSideWidth(declaration.value.top, options), {
                shortHand: true,
            });
            addStyleProp('border-bottom-width', parseBorderSideWidth(declaration.value.bottom, options), {
                shortHand: true,
            });
            addStyleProp('border-left-width', parseBorderSideWidth(declaration.value.left, options), {
                shortHand: true,
            });
            addStyleProp('border-right-width', parseBorderSideWidth(declaration.value.right, options), {
                shortHand: true,
            });
            return;
        case 'border-block-color':
            addStyleProp('border-top-color', parseColor(declaration.value.start));
            addStyleProp('border-bottom-color', parseColor(declaration.value.end));
            return;
        case 'border-block-style':
            return;
        case 'border-block-width':
            addStyleProp('border-top-width', parseBorderSideWidth(declaration.value.start, options));
            addStyleProp('border-bottom-width', parseBorderSideWidth(declaration.value.end, options));
            return;
        case 'border-inline-color':
            addStyleProp('border-left-color', parseColor(declaration.value.start));
            addStyleProp('border-right-color', parseColor(declaration.value.end));
            return;
        case 'border-inline-style':
            return;
        case 'border-inline-width':
            addStyleProp('border-left-width', parseBorderSideWidth(declaration.value.start, options));
            addStyleProp('border-right-width', parseBorderSideWidth(declaration.value.end, options));
            return;
        case 'border':
            addStyleProp('border-width', parseBorderSideWidth(declaration.value.width, options), {
                shortHand: true,
            });
            addStyleProp('border-style', parseBorderStyle(declaration.value.style), {
                shortHand: true,
            });
            return;
        case 'border-top':
            addStyleProp(declaration.property + '-color', parseColor(declaration.value.color));
            addStyleProp(declaration.property + '-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-bottom':
            addStyleProp(declaration.property + '-color', parseColor(declaration.value.color));
            addStyleProp(declaration.property + '-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-left':
            addStyleProp(declaration.property + '-color', parseColor(declaration.value.color));
            addStyleProp(declaration.property + '-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-right':
            addStyleProp(declaration.property + '-color', parseColor(declaration.value.color));
            addStyleProp(declaration.property + '-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-block':
            addStyleProp('border-top-color', parseColor(declaration.value.color));
            addStyleProp('border-bottom-color', parseColor(declaration.value.color));
            addStyleProp('border-top-width', parseBorderSideWidth(declaration.value.width, options));
            addStyleProp('border-bottom-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-block-start':
            addStyleProp('border-top-color', parseColor(declaration.value.color));
            addStyleProp('border-top-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-block-end':
            addStyleProp('border-bottom-color', parseColor(declaration.value.color));
            addStyleProp('border-bottom-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-inline':
            addStyleProp('border-left-color', parseColor(declaration.value.color));
            addStyleProp('border-right-color', parseColor(declaration.value.color));
            addStyleProp('border-left-width', parseBorderSideWidth(declaration.value.width, options));
            addStyleProp('border-right-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-inline-start':
            addStyleProp('border-left-color', parseColor(declaration.value.color));
            addStyleProp('border-left-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'border-inline-end':
            addStyleProp('border-right-color', parseColor(declaration.value.color));
            addStyleProp('border-right-width', parseBorderSideWidth(declaration.value.width, options));
            return;
        case 'outline':
            return;
        case 'outline-color':
            return;
        case 'outline-style':
            return;
        case 'outline-width':
            return;
        case 'flex-direction':
            return addStyleProp(declaration.property, declaration.value);
        case 'flex-wrap':
            return addStyleProp(declaration.property, declaration.value);
        case 'flex-flow':
            addStyleProp('flexWrap', declaration.value.wrap);
            addStyleProp('flexDirection', declaration.value.direction);
            break;
        case 'flex-grow':
            return addStyleProp(declaration.property, declaration.value);
        case 'flex-shrink':
            return addStyleProp(declaration.property, declaration.value);
        case 'flex-basis':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'flex':
            addStyleProp('flex-grow', declaration.value.grow);
            addStyleProp('flex-shrink', declaration.value.shrink);
            addStyleProp('flex-basis', parseLengthPercentageOrAuto(declaration.value.basis, options));
            break;
        case 'order':
            return;
        case 'align-content':
            return addStyleProp(declaration.property, parseAlignContent(declaration.value));
        case 'justify-content':
            return addStyleProp(declaration.property, parseJustifyContent(declaration.value));
        case 'place-content':
            return;
        case 'align-self':
            return addStyleProp(declaration.property, parseAlignSelf(declaration.value));
        case 'justify-self':
            return;
        case 'place-self':
            return;
        case 'align-items':
            return addStyleProp(declaration.property, parseAlignItems(declaration.value));
        case 'justify-items':
            return;
        case 'place-items':
            return;
        case 'row-gap':
            return addStyleProp('row-gap', parseGap(declaration.value, options));
        case 'column-gap':
            return addStyleProp('row-gap', parseGap(declaration.value, options));
        case 'gap':
            addStyleProp('row-gap', parseGap(declaration.value.row, options));
            addStyleProp('column-gap', parseGap(declaration.value.column, options));
            return;
        case 'box-orient':
            return;
        case 'box-direction':
            return;
        case 'box-ordinal-group':
            return;
        case 'box-align':
            return;
        case 'box-flex':
            return;
        case 'box-flex-group':
            return;
        case 'box-pack':
            return;
        case 'box-lines':
            return;
        case 'flex-pack':
            return;
        case 'flex-order':
            return;
        case 'flex-align':
            return;
        case 'flex-item-align':
            return;
        case 'flex-line-pack':
            return;
        case 'flex-positive':
            return;
        case 'flex-negative':
            return;
        case 'flex-preferred-size':
            return;
        case 'grid-template-columns':
            return;
        case 'grid-template-rows':
            return;
        case 'grid-auto-columns':
            return;
        case 'grid-auto-rows':
            return;
        case 'grid-auto-flow':
            return;
        case 'grid-template-areas':
            return;
        case 'grid-template':
            return;
        case 'grid':
            return;
        case 'grid-row-start':
            return;
        case 'grid-row-end':
            return;
        case 'grid-column-start':
            return;
        case 'grid-column-end':
            return;
        case 'grid-row':
            return;
        case 'grid-column':
            return;
        case 'grid-area':
            return;
        case 'margin-top':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'margin-bottom':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'margin-left':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'margin-right':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'margin-block-start':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'margin-block-end':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'margin-inline-start':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'margin-inline-end':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'margin-block':
            addStyleProp(declaration.property + '-start', parseLengthPercentageOrAuto(declaration.value.blockStart, options), { shortHand: true });
            addStyleProp(declaration.property + '-end', parseLengthPercentageOrAuto(declaration.value.blockEnd, options), { shortHand: true });
            return;
        case 'margin-inline':
            addStyleProp(declaration.property + '-start', parseLengthPercentageOrAuto(declaration.value.inlineStart, options), { shortHand: true });
            addStyleProp(declaration.property + '-end', parseLengthPercentageOrAuto(declaration.value.inlineEnd, options), { shortHand: true });
            return;
        case 'margin':
            addStyleProp('margin-top', parseSize(declaration.value.top, options));
            addStyleProp('margin-left', parseSize(declaration.value.left, options));
            addStyleProp('margin-right', parseSize(declaration.value.right, options));
            addStyleProp('margin-bottom', parseSize(declaration.value.bottom, options));
            return;
        case 'padding-top':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'padding-bottom':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'padding-left':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'padding-right':
            return addStyleProp(declaration.property, parseSize(declaration.value, options));
        case 'padding-block-start':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'padding-block-end':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'padding-inline-start':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'padding-inline-end':
            return addStyleProp(declaration.property, parseLengthPercentageOrAuto(declaration.value, options));
        case 'padding-block':
            addStyleProp(declaration.property + '-start', parseLengthPercentageOrAuto(declaration.value.blockStart, options), { shortHand: true });
            addStyleProp(declaration.property + '-end', parseLengthPercentageOrAuto(declaration.value.blockEnd, options), { shortHand: true });
            return;
        case 'padding-inline':
            addStyleProp(declaration.property + '-start', parseLengthPercentageOrAuto(declaration.value.inlineStart, options), { shortHand: true });
            addStyleProp(declaration.property + '-end', parseLengthPercentageOrAuto(declaration.value.inlineEnd, options), { shortHand: true });
            break;
        case 'padding':
            addStyleProp('padding-top', parseSize(declaration.value.top, options));
            addStyleProp('padding-left', parseSize(declaration.value.left, options));
            addStyleProp('padding-right', parseSize(declaration.value.right, options));
            addStyleProp('paddingBottom', parseSize(declaration.value.bottom, options));
            break;
        case 'scroll-margin-top':
        case 'scroll-margin-bottom':
        case 'scroll-margin-left':
        case 'scroll-margin-right':
        case 'scroll-margin-block-start':
        case 'scroll-margin-block-end':
        case 'scroll-margin-inline-start':
        case 'scroll-margin-inline-end':
        case 'scroll-margin-block':
        case 'scroll-margin-inline':
        case 'scroll-margin':
        case 'scroll-padding-top':
        case 'scroll-padding-bottom':
        case 'scroll-padding-left':
        case 'scroll-padding-right':
        case 'scroll-padding-block-start':
        case 'scroll-padding-block-end':
        case 'scroll-padding-inline-start':
        case 'scroll-padding-inline-end':
        case 'scroll-padding-block':
        case 'scroll-padding-inline':
        case 'scroll-padding':
            return;
        case 'font-weight':
            return addStyleProp(declaration.property, parseFontWeight(declaration.value));
        case 'font-size':
            return addStyleProp(declaration.property, parseFontSize(declaration.value, options));
        case 'font-stretch':
            return;
        case 'font-family':
            return addStyleProp(declaration.property, parseFontFamily(declaration.value));
        case 'font-style':
            return addStyleProp(declaration.property, parseFontStyle(declaration.value));
        case 'font-variant-caps':
            return addStyleProp(declaration.property, parseFontVariantCaps(declaration.value));
        case 'line-height':
            return addStyleProp(declaration.property, parseLineHeight(declaration.value, options));
        case 'font':
            addStyleProp(declaration.property + '-family', parseFontFamily(declaration.value.family), {
                shortHand: true,
            });
            addStyleProp('line-height', parseLineHeight(declaration.value.lineHeight, options), {
                shortHand: true,
            });
            addStyleProp(declaration.property + '-size', parseFontSize(declaration.value.size, options), {
                shortHand: true,
            });
            addStyleProp(declaration.property + '-style', parseFontStyle(declaration.value.style), {
                shortHand: true,
            });
            addStyleProp(declaration.property + '-variant', parseFontVariantCaps(declaration.value.variantCaps), { shortHand: true });
            addStyleProp(declaration.property + '-weight', parseFontWeight(declaration.value.weight), {
                shortHand: true,
            });
            return;
        case 'vertical-align':
            return addStyleProp(declaration.property, parseVerticalAlign(declaration.value));
        case 'font-palette':
            return;
        case 'transition-property':
        case 'transition-duration':
        case 'transition-delay':
        case 'transition-timing-function':
        case 'transition':
            return addTransitionProp(declaration);
        case 'animation-duration':
        case 'animation-timing-function':
        case 'animation-iteration-count':
        case 'animation-direction':
        case 'animation-play-state':
        case 'animation-delay':
        case 'animation-fill-mode':
        case 'animation-name':
        case 'animation':
            return addAnimationProp(declaration.property, declaration.value);
        case 'transform': {
            const transforms = [];
            for (const transform of declaration.value) {
                switch (transform.type) {
                    case 'perspective':
                        transforms.push({
                            [transform.type]: parseLength(transform.value, options),
                        });
                        break;
                    case 'translateX':
                    case 'scaleX':
                        transforms.push({
                            [transform.type]: parseLengthOrCoercePercentageToRuntime(transform.value, 'cw', options),
                        });
                        break;
                    case 'translateY':
                    case 'scaleY':
                        transforms.push({
                            [transform.type]: parseLengthOrCoercePercentageToRuntime(transform.value, 'ch', options),
                        });
                        break;
                    case 'rotate':
                    case 'rotateX':
                    case 'rotateY':
                    case 'rotateZ':
                    case 'skewX':
                    case 'skewY':
                        transforms.push({ [transform.type]: parseAngle(transform.value) });
                        break;
                    case 'translate':
                        transforms.push({
                            translateX: parseLength(transform.value[0], options),
                        });
                        transforms.push({
                            translateY: parseLength(transform.value[1], options),
                        });
                        break;
                    case 'scale':
                        transforms.push({
                            scaleX: parseLength(transform.value[0], options),
                        });
                        transforms.push({
                            scaleY: parseLength(transform.value[1], options),
                        });
                        break;
                    case 'skew':
                        transforms.push({ skewX: parseAngle(transform.value[0]) });
                        transforms.push({ skewY: parseAngle(transform.value[1]) });
                        break;
                    case 'translateZ':
                    case 'translate3d':
                    case 'scaleZ':
                    case 'scale3d':
                    case 'rotate3d':
                    case 'matrix':
                    case 'matrix3d':
                        break;
                }
            }
            return addStyleProp(declaration.property, transforms);
        }
        case 'transform-origin':
            return;
        case 'transform-style':
            return;
        case 'transform-box':
            return;
        case 'backface-visibility':
            return;
        case 'perspective':
            return;
        case 'perspective-origin':
            return;
        case 'translate':
            return addStyleProp('transform', [{ translateX: declaration.value.x }, { translateY: declaration.value.y }], { append: true });
        case 'rotate':
            return addStyleProp('transform', [
                { rotateX: declaration.value.x },
                { rotateY: declaration.value.y },
                { rotateY: declaration.value.z },
            ], { append: true });
        case 'scale':
            return addStyleProp('transform', [
                { scaleX: parseLength(declaration.value.x, options) },
                { scaleY: parseLength(declaration.value.y, options) },
            ], { append: true });
        case 'text-transform':
            return addStyleProp(declaration.property, declaration.value.case);
        case 'white-space':
            return;
        case 'tab-size':
            return;
        case 'word-break':
            return;
        case 'line-break':
            return;
        case 'hyphens':
            return;
        case 'overflow-wrap':
            return;
        case 'word-wrap':
            return;
        case 'text-align':
            return;
        case 'text-align-last':
            return;
        case 'text-justify':
            return;
        case 'word-spacing':
            return;
        case 'letter-spacing':
            if (declaration.value.type !== 'normal') {
                return addStyleProp(declaration.property, parseLength(declaration.value.value, options));
            }
            return;
        case 'text-indent':
            return;
        case 'text-decoration-line':
            return addStyleProp(declaration.property, parseTextDecorationLine(declaration.value));
        case 'text-decoration-style':
            return;
        case 'text-decoration-color':
            return addStyleProp(declaration.property, parseColor(declaration.value));
        case 'text-decoration-thickness':
            if (declaration.value.type === 'length-percentage') {
                return addStyleProp(declaration.property, parseLength(declaration.value.value, options));
            }
            return;
        case 'text-decoration':
            addStyleProp('text-decoration-color', parseColor(declaration.value.color));
            addStyleProp('text-decoration-line', parseTextDecorationLine(declaration.value.line));
            if (declaration.value.thickness.type === 'length-percentage') {
                addStyleProp(declaration.property, parseLength(declaration.value.thickness.value, options));
            }
            return;
        case 'text-decoration-skip-ink':
            return;
        case 'text-emphasis-style':
            return;
        case 'text-emphasis-color':
            return;
        case 'text-emphasis':
            return;
        case 'text-emphasis-position':
            return;
        case 'text-shadow':
            return parseTextShadow(declaration.value, addStyleProp, options);
        case 'box-decoration-break':
        case 'resize':
        case 'cursor':
        case 'caret-color':
        case 'caret-shape':
        case 'caret':
        case 'user-select':
        case 'accent-color':
        case 'appearance':
        case 'list-style-type':
        case 'list-style-image':
        case 'list-style-position':
        case 'list-style':
        case 'marker-side':
        case 'composes':
        case 'fill':
        case 'fill-rule':
        case 'fill-opacity':
        case 'stroke':
        case 'stroke-opacity':
        case 'stroke-width':
        case 'stroke-linecap':
        case 'stroke-linejoin':
        case 'stroke-miterlimit':
        case 'stroke-dasharray':
        case 'stroke-dashoffset':
        case 'marker-start':
        case 'marker-mid':
        case 'marker-end':
        case 'marker':
        case 'color-interpolation':
        case 'color-interpolation-filters':
        case 'color-rendering':
        case 'shape-rendering':
        case 'text-rendering':
        case 'image-rendering':
        case 'clip-path':
        case 'clip-rule':
        case 'mask-image':
        case 'mask-mode':
        case 'mask-repeat':
        case 'mask-position-x':
        case 'mask-position-y':
        case 'mask-position':
        case 'mask-clip':
        case 'mask-origin':
        case 'mask-size':
        case 'mask-composite':
        case 'mask-type':
        case 'mask':
        case 'mask-border-source':
        case 'mask-border-mode':
        case 'mask-border-slice':
        case 'mask-border-width':
        case 'mask-border-outset':
        case 'mask-border-repeat':
        case 'mask-border':
        case '-webkit-mask-composite':
        case 'mask-source-type':
        case 'mask-box-image':
        case 'mask-box-image-source':
        case 'mask-box-image-slice':
        case 'mask-box-image-width':
        case 'mask-box-image-outset':
        case 'mask-box-image-repeat':
        case 'filter':
        case 'backdrop-filter':
            return;
        case 'z-index':
            if (declaration.value.type === 'integer') {
                addStyleProp(declaration.property, parseLength(declaration.value.value, options));
            }
            return;
        case 'container-type':
        case 'container-name':
        case 'container':
            return addContainerProp(declaration);
        default: {
            exhaustiveCheck(declaration);
        }
    }
}
function reduceParseUnparsed(tokenOrValues, options, allowUnwrap = false) {
    const result = tokenOrValues
        .flatMap((tokenOrValue) => parseUnparsed(tokenOrValue, options))
        .filter((v) => v !== undefined);
    if (result.length === 0) {
        return undefined;
    }
    else if (result.length === 1 && allowUnwrap) {
        return result[0];
    }
    else {
        return result;
    }
}
function unparsedToUnparsedLonghand(type, longhands, args, options) {
    return longhands
        .map((longhand, i) => {
        return {
            type,
            name: longhand,
            arguments: [parseUnparsed(args[i], options)],
        };
    })
        .filter((v) => v.arguments.length);
}
/**
 * When the CSS cannot be parsed (often due to a runtime condition like a CSS variable)
 * This function best efforts parsing it into a function that we can evaluate at runtime
 */
function parseUnparsed(tokenOrValue, options) {
    if (typeof tokenOrValue === 'string' || typeof tokenOrValue === 'number') {
        return tokenOrValue;
    }
    if (Array.isArray(tokenOrValue)) {
        return reduceParseUnparsed(tokenOrValue, options, true);
    }
    switch (tokenOrValue.type) {
        case 'unresolved-color': {
            const value = tokenOrValue.value;
            if (value.type === 'rgb') {
                return {
                    type: 'runtime',
                    name: 'rgba',
                    arguments: [
                        value.r * 255,
                        value.g * 255,
                        value.b * 255,
                        parseUnparsed(tokenOrValue.value.alpha, options),
                    ],
                };
            }
            else {
                return {
                    type: 'runtime',
                    name: tokenOrValue.value.type,
                    arguments: [value.h, value.s, value.l, parseUnparsed(tokenOrValue.value.alpha, options)],
                };
            }
        }
        case 'var': {
            return {
                type: 'runtime',
                name: 'var',
                arguments: [tokenOrValue.value.name.ident, tokenOrValue.value.fallback],
            };
        }
        case 'function': {
            switch (tokenOrValue.value.name) {
                case 'translate':
                    return unparsedToUnparsedLonghand('function', ['translateX', 'translateY'], tokenOrValue.value.arguments, options);
                default: {
                    return {
                        type: tokenOrValue.type,
                        name: tokenOrValue.value.name,
                        arguments: reduceParseUnparsed(tokenOrValue.value.arguments, options),
                    };
                }
            }
        }
        case 'length':
            return parseLength(tokenOrValue.value, options);
        case 'angle':
            return parseAngle(tokenOrValue.value);
        case 'color':
        case 'url':
        case 'env':
        case 'time':
        case 'resolution':
        case 'dashed-ident':
            return;
        case 'token':
            switch (tokenOrValue.value.type) {
                case 'string':
                case 'number':
                    return tokenOrValue.value.value;
                case 'function':
                case 'ident':
                case 'at-keyword':
                case 'hash':
                case 'id-hash':
                case 'unquoted-url':
                case 'delim':
                case 'percentage':
                case 'dimension':
                case 'white-space':
                case 'comment':
                case 'colon':
                case 'semicolon':
                case 'comma':
                case 'include-match':
                case 'dash-match':
                case 'prefix-match':
                case 'suffix-match':
                case 'substring-match':
                case 'cdo':
                case 'cdc':
                case 'parenthesis-block':
                case 'square-bracket-block':
                case 'curly-bracket-block':
                case 'bad-url':
                case 'bad-string':
                case 'close-parenthesis':
                case 'close-square-bracket':
                case 'close-curly-bracket':
                    return undefined;
                default: {
                    exhaustiveCheck(tokenOrValue.value);
                    return;
                }
            }
        default: {
            exhaustiveCheck(tokenOrValue);
        }
    }
    return undefined;
}
export function parseLength(length, options) {
    const { inlineRem = 14 } = options;
    if (typeof length === 'number') {
        return length;
    }
    if ('unit' in length) {
        switch (length.unit) {
            case 'px':
                return length.value;
            case 'rem':
                if (typeof inlineRem === 'number') {
                    return length.value * inlineRem;
                }
                else {
                    return {
                        type: 'runtime',
                        name: 'rem',
                        arguments: [length.value],
                    };
                }
            case 'vw':
            case 'vh':
                return {
                    type: 'runtime',
                    name: length.unit,
                    arguments: [length.value],
                };
            case 'in':
            case 'cm':
            case 'mm':
            case 'q':
            case 'pt':
            case 'pc':
            case 'em':
            case 'ex':
            case 'rex':
            case 'ch':
            case 'rch':
            case 'cap':
            case 'rcap':
            case 'ic':
            case 'ric':
            case 'lh':
            case 'rlh':
            case 'lvw':
            case 'svw':
            case 'dvw':
            case 'cqw':
            case 'lvh':
            case 'svh':
            case 'dvh':
            case 'cqh':
            case 'vi':
            case 'svi':
            case 'lvi':
            case 'dvi':
            case 'cqi':
            case 'vb':
            case 'svb':
            case 'lvb':
            case 'dvb':
            case 'cqb':
            case 'vmin':
            case 'svmin':
            case 'lvmin':
            case 'dvmin':
            case 'cqmin':
            case 'vmax':
            case 'svmax':
            case 'lvmax':
            case 'dvmax':
            case 'cqmax':
                return undefined;
            default: {
                exhaustiveCheck(length.unit);
            }
        }
    }
    else {
        switch (length.type) {
            case 'calc': {
                return undefined;
            }
            case 'number': {
                return length.value;
            }
            case 'percentage': {
                return `${round(length.value * 100)}%`;
            }
            case 'dimension':
            case 'value': {
                return parseLength(length.value, options);
            }
        }
    }
    return undefined;
}
function parseAngle(angle) {
    switch (angle.type) {
        case 'deg':
        case 'rad':
            return `${angle.value}${angle.type}`;
        default:
            return undefined;
    }
}
function parseSize(size, options) {
    switch (size.type) {
        case 'length-percentage':
            return parseLength(size.value, options);
        case 'none':
            return size.type;
        case 'auto':
            return size.type;
        case 'min-content':
        case 'max-content':
        case 'fit-content':
        case 'fit-content-function':
        case 'stretch':
        case 'contain':
            return undefined;
        default: {
            exhaustiveCheck(size);
        }
    }
    return undefined;
}
function parseColor(color) {
    switch (color.type) {
        case 'rgb':
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`;
        case 'hsl':
            return `hsla(${color.h}, ${color.s}, ${color.l}, ${color.alpha})`;
        case 'currentcolor':
        case 'lab':
        case 'lch':
        case 'oklab':
        case 'oklch':
        case 'srgb':
        case 'srgb-linear':
        case 'display-p3':
        case 'a98-rgb':
        case 'prophoto-rgb':
        case 'rec2020':
        case 'xyz-d50':
        case 'xyz-d65':
        case 'hwb':
            return undefined;
        default: {
            exhaustiveCheck(color);
        }
    }
    return undefined;
}
function parseLengthPercentageOrAuto(lengthPercentageOrAuto, options) {
    switch (lengthPercentageOrAuto.type) {
        case 'auto':
            return;
        case 'length-percentage':
            return parseLength(lengthPercentageOrAuto.value, options);
        default: {
            exhaustiveCheck(lengthPercentageOrAuto);
        }
    }
    return undefined;
}
function parseJustifyContent(justifyContent) {
    const allowed = new Set([
        'flex-start',
        'flex-end',
        'center',
        'space-between',
        'space-around',
        'space-evenly',
    ]);
    let value;
    switch (justifyContent.type) {
        case 'normal':
            return;
        case 'left':
        case 'right':
            return;
        case 'content-distribution':
        case 'content-position':
            value = justifyContent.value;
            break;
        default: {
            exhaustiveCheck(justifyContent);
        }
    }
    if (value && !allowed.has(value)) {
        return;
    }
    return value;
}
function parseAlignContent(alignItems) {
    const allowed = new Set([
        'flex-start',
        'flex-end',
        'center',
        'stretch',
        'space-between',
        'space-around',
    ]);
    let value;
    switch (alignItems.type) {
        case 'normal':
        case 'baseline-position':
            break;
        case 'content-distribution':
            value = alignItems.value;
            break;
        case 'content-position':
            value = alignItems.value;
            break;
        default: {
            exhaustiveCheck(alignItems);
        }
    }
    if (value && !allowed.has(value)) {
        return;
    }
    return value;
}
function parseAlignItems(alignItems) {
    const allowed = new Set(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']);
    let value;
    switch (alignItems.type) {
        case 'normal':
            return 'auto';
        case 'stretch':
            value = alignItems.type;
            break;
        case 'baseline-position':
            value = 'baseline';
            break;
        case 'self-position':
            value = alignItems.value;
            break;
        default: {
            exhaustiveCheck(alignItems);
        }
    }
    if (value && !allowed.has(value)) {
        return;
    }
    return value;
}
function parseAlignSelf(alignItems) {
    const allowed = new Set(['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline']);
    let value;
    switch (alignItems.type) {
        case 'normal':
        case 'auto':
            return 'auto';
        case 'stretch':
            value = alignItems.type;
            break;
        case 'baseline-position':
            value = 'baseline';
            break;
        case 'self-position':
            value = alignItems.value;
            break;
        default: {
            exhaustiveCheck(alignItems);
        }
    }
    if (value && !allowed.has(value)) {
        return;
    }
    return value;
}
function parseFontWeight(fontWeight) {
    switch (fontWeight.type) {
        case 'absolute':
            if (fontWeight.value.type === 'weight') {
                return fontWeight.value.value;
            }
            else {
                return fontWeight.value.type;
            }
        case 'bolder':
        case 'lighter':
            return;
        default: {
            exhaustiveCheck(fontWeight);
        }
    }
    return undefined;
}
function parseTextShadow([textshadow], addStyleProp, options) {
    addStyleProp('textShadowColor', parseColor(textshadow.color));
    addStyleProp('textShadowOffset', {
        width: parseLength(textshadow.xOffset, options),
        height: parseLength(textshadow.yOffset, options),
    });
    addStyleProp('textShadowRadius', parseLength(textshadow.blur, options));
}
function parseTextDecorationLine(textDecorationLine) {
    if (!Array.isArray(textDecorationLine)) {
        if (textDecorationLine === 'none') {
            return textDecorationLine;
        }
        return;
    }
    const set = new Set(textDecorationLine);
    if (set.has('underline')) {
        if (set.has('line-through')) {
            return 'underline line-through';
        }
        else {
            return 'underline';
        }
    }
    else if (set.has('line-through')) {
        return 'line-through';
    }
    return undefined;
}
function parseOverflow(overflow) {
    const allowed = new Set(['visible', 'hidden', 'scroll']);
    if (allowed.has(overflow)) {
        return overflow;
    }
    return undefined;
}
function parseBorderStyle(borderStyle) {
    const allowed = new Set(['solid', 'dotted', 'dashed']);
    if (typeof borderStyle === 'string') {
        if (allowed.has(borderStyle)) {
            return borderStyle;
        }
        else {
            return undefined;
        }
    }
    else if (borderStyle.top === borderStyle.bottom &&
        borderStyle.top === borderStyle.left &&
        borderStyle.top === borderStyle.right &&
        allowed.has(borderStyle.top)) {
        return borderStyle.top;
    }
    return undefined;
}
function parseBorderSideWidth(borderSideWidth, options) {
    if (borderSideWidth.type === 'length') {
        return parseLength(borderSideWidth.value, options);
    }
    return undefined;
}
function parseVerticalAlign(verticalAlign) {
    if (verticalAlign.type === 'length') {
        return undefined;
    }
    const allowed = new Set(['auto', 'top', 'bottom', 'middle']);
    if (allowed.has(verticalAlign.value)) {
        return verticalAlign.value;
    }
    return undefined;
}
function parseFontFamily(fontFamily) {
    const nativeFont = fontFamily.find((f) => f.startsWith('react-native'));
    if (nativeFont) {
        return nativeFont.replace('react-native', '');
    }
    return fontFamily[0];
}
function parseLineHeight(lineHeight, options) {
    if (lineHeight.type === 'number') {
        return {
            type: 'runtime',
            name: 'em',
            arguments: [lineHeight.value],
        };
    }
    else if (lineHeight.type === 'length') {
        const length = lineHeight.value;
        if (length.type === 'dimension') {
            return parseLength(length, options);
        }
    }
    return undefined;
}
function parseFontSize(fontSize, options) {
    switch (fontSize.type) {
        case 'length':
            return parseLength(fontSize.value, options);
        case 'absolute':
        case 'relative':
            return undefined;
        default: {
            exhaustiveCheck(fontSize);
        }
    }
    return undefined;
}
function parseFontStyle(fontStyle) {
    switch (fontStyle.type) {
        case 'normal':
        case 'italic':
            return fontStyle.type;
        case 'oblique':
            return undefined;
        default: {
            exhaustiveCheck(fontStyle);
        }
    }
    return undefined;
}
function parseFontVariantCaps(fontVariantCaps) {
    const allowed = new Set([
        'small-caps',
        'oldstyle-nums',
        'lining-nums',
        'tabular-nums',
        'proportional-nums',
    ]);
    if (allowed.has(fontVariantCaps)) {
        return fontVariantCaps;
    }
    return undefined;
}
function parseLengthOrCoercePercentageToRuntime(value, runtimeName, options) {
    if (value.type === 'percentage') {
        options.requiresLayout();
        return {
            type: 'runtime',
            name: runtimeName,
            arguments: [value.value],
        };
    }
    else {
        return parseLength(value, options);
    }
}
function parseGap(value, options) {
    if (value.type === 'normal') {
        return;
    }
    return parseLength(value.value, options);
}
function round(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100;
}
//# sourceMappingURL=parseDeclaration.js.map