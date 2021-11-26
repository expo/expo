package com.horcrux.svg;

// TODO implement https://www.w3.org/TR/SVG2/text.html#TextLayoutAlgorithm

import android.graphics.Path;
import android.graphics.PathMeasure;
import android.graphics.PointF;
import android.view.View;

import java.util.ArrayList;

import static com.horcrux.svg.TextProperties.Direction;
import static com.horcrux.svg.TextProperties.TextAnchor;
import static com.horcrux.svg.TextProperties.TextPathSide;

@SuppressWarnings("ALL")
class TextLayoutAlgorithm {
    class CharacterInformation {
        int index;
        double x = 0;
        double y = 0;
        double advance;
        char character;
        double rotate = 0;
        TextView element;
        boolean hidden = false;
        boolean middle = false;
        boolean resolved = false;
        boolean xSpecified = false;
        boolean ySpecified = false;
        boolean addressable = true;
        boolean anchoredChunk = false;
        boolean rotateSpecified = false;
        boolean firstCharacterInResolvedDescendant = false;

        CharacterInformation(int index, char c) {
            this.index = index;
            this.character = c;
        }
    }

    class LayoutInput {
        TextView text;
        boolean horizontal;
    }

    private void getSubTreeTypographicCharacterPositions(
            ArrayList<TextPathView> inTextPath,
            ArrayList<TextView> subtree,
            StringBuilder line,
            View node,
            TextPathView textPath
    ) {
        if (node instanceof TSpanView) {
            final TSpanView tSpanView = (TSpanView) node;
            String content = tSpanView.mContent;
            if (content == null) {
                for (int i = 0; i < tSpanView.getChildCount(); i++) {
                    getSubTreeTypographicCharacterPositions(inTextPath, subtree, line, tSpanView.getChildAt(i), textPath);
                }
            } else {
                for (int i = 0; i < content.length(); i++) {
                    subtree.add(tSpanView);
                    inTextPath.add(textPath);
                }
                line.append(content);
            }
        } else {
            textPath = node instanceof TextPathView ? (TextPathView) node : textPath;
            for (int i = 0; i < textPath.getChildCount(); i++) {
                getSubTreeTypographicCharacterPositions(inTextPath, subtree, line, textPath.getChildAt(i), textPath);
            }
        }
    }

    CharacterInformation[] layoutText(LayoutInput layoutInput) {
/*
      Setup

      Let root be the result of generating
      typographic character positions for the
      ‘text’ element and its subtree, laid out as if it
      were an absolutely positioned element.

        This will be a single line of text unless the
        white-space property causes line breaks.
*/
        TextView text = layoutInput.text;
        StringBuilder line = new StringBuilder();
        ArrayList<TextView> subtree = new ArrayList<>();
        ArrayList<TextPathView> inTextPath = new ArrayList<>();
        getSubTreeTypographicCharacterPositions(inTextPath, subtree, line, text, null);
        final char[] root = line.toString().toCharArray();
/*
      Let count be the number of DOM characters
      within the ‘text’ element's subtree.
*/
        int count = root.length;
/*

      Let result be an array of length count
      whose entries contain the per-character information described
      above.  Each entry is initialized as follows:

        its global index number equal to its position in the array,
        its "x" coordinate set to "unspecified",
        its "y" coordinate set to "unspecified",
        its "rotate" coordinate set to "unspecified",
        its "hidden" flag is false,
        its "addressable" flag is true,
        its "middle" flag is false,
        its "anchored chunk" flag is false.
*/
        final CharacterInformation[] result = new CharacterInformation[count];
        for (int i = 0; i < count; i++) {
            result[i] = new CharacterInformation(i, root[i]);
        }
/*
      If result is empty, then return result.
*/
        if (count == 0) {
            return result;
        }
/*

      Let CSS_positions be an array of length
      count whose entries will be filled with the
      x and y positions of the corresponding
      typographic character in root. The array
      entries are initialized to (0, 0).
*/
        PointF[] CSS_positions = new PointF[count];
        for (int i = 0; i < count; i++) {
            CSS_positions[i] = new PointF(0, 0);
        }
/*
      Let "horizontal" be a flag, true if the writing mode of ‘text’
      is horizontal, false otherwise.
*/
        final boolean horizontal = true;
/*
      Set flags and assign initial positions

    For each array element with index i in
    result:
*/
        for (int i = 0; i < count; i++) {
/*
      TODO Set addressable to false if the character at index i was:

          part of the text content of a non-rendered element

          discarded during layout due to being a
          collapsed
        white space character, a soft hyphen character, or a
          bidi control character; or


          discarded during layout due to being a
          collapsed
        segment break; or


          trimmed
          from the start or end of a line.

          Since there is collapsible white space not addressable by glyph
          positioning attributes in the following ‘text’ element
          (with a standard font), the "B" glyph will be placed at x=300.

        <text x="100 200 300">
          A
          B
          </text>

          This is because the white space before the "A", and all but one white space
          character between the "A" and "B", is collapsed away or trimmed.

*/
            result[i].addressable = true;
/*

      Set middle to true if the character at index i
      TODO is the second or later character that corresponds to a typographic character.
*/
            result[i].middle = false;
/*

      TODO If the character at index i corresponds to a typographic character at the beginning of a line, then set the "anchored
      chunk" flag of result[i] to true.

        This ensures chunks shifted by text-anchor do not
        span multiple lines.
*/
            result[i].anchoredChunk = i == 0;
/*

      If addressable is true and middle is false then
      set CSS_positions[i] to the position of the
      TODO corresponding typographic character as determined by the CSS
      renderer. Otherwise, if i > 0, then set
      CSS_positions[i] =
      CSS_positions[i − 1]

*/
            if (result[i].addressable && !result[i].middle) {
                CSS_positions[i].set(0, 0);
            } else if (i > 0) {
                CSS_positions[i].set(CSS_positions[i - 1]);
            }
        }
/*

      Resolve character positioning

    Position adjustments (e.g values in a ‘x’ attribute)
    specified by a node apply to all characters in that node including
    characters in the node's descendants. Adjustments specified in
    descendant nodes, however, override adjustments from ancestor
    nodes. This section resolves which adjustments are to be applied to
    which characters. It also directly sets the rotate coordinate
    of result.

      Set up:

          Let resolve_x, resolve_y,
          resolve_dx, and resolve_dy be arrays of
          length count whose entries are all initialized
          to "unspecified".
*/
        String[] resolve_x = new String[count];
        String[] resolve_y = new String[count];
        String[] resolve_dx = new String[count];
        String[] resolve_dy = new String[count];
/*

          Set "in_text_path" flag false.

        This flag will allow ‘y’ (‘x’)
        attribute values to be ignored for horizontal (vertical)
        text inside ‘textPath’ elements.
*/
        boolean in_text_path = false;
/*
          Call the following procedure with the ‘text’ element node.

      Procedure: resolve character
          positioning:

        A recursive procedure that takes as input a node and
        whose steps are as follows:
*/
        class CharacterPositioningResolver {
            private int global = 0;
            private boolean horizontal = true;
            private boolean in_text_path = false;
            private CharacterInformation[] result;
            private String[] resolve_x;
            private String[] resolve_y;
            private String[] resolve_dx;
            private String[] resolve_dy;

            private CharacterPositioningResolver(
                CharacterInformation[] result,
                String[] resolve_x,
                String[] resolve_y,
                String[] resolve_dx,
                String[] resolve_dy
            ) {
                this.result = result;
                this.resolve_x = resolve_x;
                this.resolve_y = resolve_y;
                this.resolve_dx = resolve_dx;
                this.resolve_dy = resolve_dy;
            }

            private void resolveCharacterPositioning(TextView node) {
/*
          If node is a ‘text’ or ‘tspan’ node:
*/
                if (node.getClass() == TextView.class || node.getClass() == TSpanView.class) {
/*
          Let index equal the "global index number" of the
          first character in the node.
*/
                    int index = global;
/*
          Let x, y, dx, dy
          and rotate be the lists of values from the
          TODO corresponding attributes on node, or empty
          lists if the corresponding attribute was not specified
          or was invalid.
*/
                    // https://www.w3.org/TR/SVG/text.html#TSpanElementXAttribute
                    String[] x = new String[]{};

                    // https://www.w3.org/TR/SVG/text.html#TSpanElementYAttribute
                    String[] y = new String[]{};

                    // Current <list-of-lengths> SVGLengthList
                    // https://www.w3.org/TR/SVG/types.html#DataTypeLengths

                    // https://www.w3.org/TR/SVG/text.html#TSpanElementDXAttribute
                    String[] dx = new String[]{};

                    // https://www.w3.org/TR/SVG/text.html#TSpanElementDYAttribute
                    String[] dy = new String[]{};

                    // Current <list-of-numbers> SVGLengthList
                    // https://www.w3.org/TR/SVG/types.html#DataTypeNumbers

                    // https://www.w3.org/TR/SVG/text.html#TSpanElementRotateAttribute
                    double[] rotate = new double[]{};
/*

          If "in_text_path" flag is false:
              Let new_chunk_count
              = max(length of x, length of y).
*/
                    int new_chunk_count;
                    if (!in_text_path) {
                        new_chunk_count = Math.max(x.length, y.length);
/*

          Else:
*/
                    } else {
/*
              If the "horizontal" flag is true:

              Let new_chunk_count = length of x.
*/
                        if (horizontal) {
                            new_chunk_count = x.length;
/*

              Else:

              Let new_chunk_count = length of y.
*/
                        } else {
                            new_chunk_count = y.length;
                        }
                    }
/*

          Let length be the number of DOM characters in the
          subtree rooted at node.
*/
                    String content = ((TSpanView) node).mContent;
                    int length = content == null ? 0 : content.length();
/*
          Let i = 0 and j = 0.

            i is an index of addressable characters in the node;
            j is an index of all characters in the node.
*/
                    int i = 0;
                    int j = 0;
/*
          While j < length, do:
*/
                    while (j < length) {
/*
            This loop applies the ‘x’, ‘y’,
            ‘dx’, ‘dy’ and ‘rotate’
            attributes to the content inside node.
              If the "addressable" flag of result[index +
              j] is true, then:
*/
                        if (result[index + j].addressable) {
/*
              If i < TODO new_check_count, then (typo)
              set the "anchored chunk" flag of
              result[index + j] to
              true. Else set the flag to false.

                Setting the flag to false ensures that ‘x’
                and ‘y’ attributes set in a ‘text’
                element don't create anchored chunk in a ‘textPath’
                element when they should not.
*/
                            result[index + j].anchoredChunk = i < new_chunk_count;
/*

              If i < length of x,
              then set resolve_x[index
              + j] to x[i].
*/
                            if (i < x.length) {
                                resolve_x[index + j] = x[i];
                            }
/*

              If "in_text_path" flag is true and the "horizontal"
              flag is false, unset
              resolve_x[index].

                The ‘x’ attribute is ignored for
                vertical text on a path.
*/
                            if (in_text_path && !horizontal) {
                                resolve_x[index] = "";
                            }
/*

              If i < length of y,
              then set resolve_y[index
              + j] to y[i].
*/
                            if (i < y.length) {
                                resolve_y[index + j] = y[i];
                            }
/*
              If "in_text_path" flag is true and the "horizontal"
              flag is true, unset
              resolve_y[index].

                The ‘y’ attribute is ignored for
                horizontal text on a path.
*/
                            if (in_text_path && horizontal) {
                                resolve_y[index] = "";
                            }
/*
              If i < length of dx,
              then set resolve_dx[index
              + j] to TODO dy[i]. (typo)
*/
                            if (i < dx.length) {
                                resolve_dx[index + j] = dx[i];
                            }
/*
              If i < length of dy,
              then set resolve_dy[index
              + j] to dy[i].
*/
                            if (i < dy.length) {
                                resolve_dy[index + j] = dy[i];
                            }
/*
              If i < length of rotate,
              then set the angle value of result[index
              + j] to rotate[i].
              Otherwise, if rotate is not empty, then
              set result[index + j]
              to result[index + j − 1].
*/
                            if (i < rotate.length) {
                                result[index + j].rotate = rotate[i];
                            } else if (rotate.length != 0) {
                                result[index + j].rotate = result[index + j - 1].rotate;
                            }
/*
              Set i = i + 1.
              Set j = j + 1.
*/
                        }
                        i++;
                        j++;
                    }
/*
          If node is a ‘textPath’ node:

          Let index equal the global index number of the
          first character in the node (including descendant nodes).
*/
                } else if (node.getClass() == TextPathView.class) {
                    int index = global;
/*
          Set the "anchored chunk" flag of result[index]
          to true.

            A ‘textPath’ element always creates an anchored chunk.
*/
                    result[index].anchoredChunk = true;
/*
          Set in_text_path flag true.
*/
                    in_text_path = true;
/*
          For each child node child of node:
          Resolve glyph
            positioning of child.
*/
                    for (int child = 0; child < node.getChildCount(); child++) {
                        resolveCharacterPositioning((TextView) node.getChildAt(child));
                    }
/*
          If node is a ‘textPath’ node:

          Set "in_text_path" flag false.

*/
                    if (node instanceof TextPathView) {
                        in_text_path = false;
                    }
                }
            }
        }

        CharacterPositioningResolver resolver = new CharacterPositioningResolver(
            result,
            resolve_x,
            resolve_y,
            resolve_dx,
            resolve_dy
        );
/*
      Adjust positions: dx, dy

    The ‘dx’ and ‘dy’ adjustments are applied
    before adjustments due to the ‘textLength’ attribute while
    the ‘x’, ‘y’ and ‘rotate’
    adjustments are applied after.

      Let shift be the cumulative x and
      y shifts due to ‘x’ and ‘y’
      attributes, initialized to (0,0).
*/
        PointF shift = new PointF(0, 0);
/*
      For each array element with index i in result:
*/
        for (int i = 0; i < count; i++) {
/*
          If resolve_x[i] is unspecified, set it to 0.
          If resolve_y[i] is unspecified, set it to 0.
*/
            if (resolve_x[i].equals("")) {
                resolve_x[i] = "0";
            }
            if (resolve_y[i].equals("")) {
                resolve_y[i] = "0";
            }
/*
          Let shift.x = shift.x + resolve_x[i]
          and shift.y = shift.y + resolve_y[i].
*/
            shift.x = shift.x + Float.parseFloat(resolve_x[i]);
            shift.y = shift.y + Float.parseFloat(resolve_y[i]);
/*
          Let result[i].x = CSS_positions[i].x + shift.x
          and result[i].y = CSS_positions[i].y + shift.y.
*/
            result[i].x = CSS_positions[i].x + shift.x;
            result[i].y = CSS_positions[i].y + shift.y;
        }
/*
      TODO Apply ‘textLength’ attribute

      Set up:

          Define resolved descendant node as a
          descendant of node with a valid ‘textLength’
          attribute that is not itself a descendant node of a
          descendant node that has a valid ‘textLength’
          attribute.

          Call the following procedure with the ‘text’ element
          node.

      Procedure: resolve text length:

        A recursive procedure that takes as input
        a node and whose steps are as follows:
          For each child node child of node:

          Resolve text length of child.

            Child nodes are adjusted before parent nodes.
*/
        class TextLengthResolver {
            int global;

            private void resolveTextLength(TextView node) {
            /*

          If node is a ‘text’ or ‘tspan’ node
          and if the node has a valid ‘textLength’ attribute value:
*/
                final Class<? extends TextView> nodeClass = node.getClass();
                final boolean validTextLength = node.mTextLength != null;
                if (
                    (nodeClass == TSpanView.class)
                        && validTextLength
                    ) {
                /*
          Let a = +∞ and b = −∞.
*/
                    double a = Double.POSITIVE_INFINITY;
                    double b = Double.NEGATIVE_INFINITY;
/*


          Let i and j be the global
          index of the first character and last characters
          in node, respectively.
*/
                    String content = ((TSpanView) node).mContent;
                    int i = global;
                    int j = i + (content == null ? 0 : content.length());
/*
          For each index k in the range
          [i, j] where the "addressable" flag
          of result[k] is true:

            This loop finds the left-(top-) most and
            right-(bottom-) most extents of the typographic characters within the node and checks for
            forced line breaks.
*/
                    for (int k = i; k <= j; k++) {
                        if (!result[i].addressable) {
                            continue;
                        }
/*
              If the character at k is a linefeed
              or carriage return, return. No adjustments due to
              ‘textLength’ are made to a node with
              a forced line break.
*/
                        switch (result[i].character) {
                            case '\n':
                            case '\r':
                                return;
                        }
/*
              Let pos = the x coordinate of the position
              in result[k], if the "horizontal"
              flag is true, and the y coordinate otherwise.
*/
                        double pos = horizontal ? result[k].x : result[k].y;
/*
              Let advance = the advance of
              the typographic character corresponding to
              character k. [NOTE: This advance will be
              negative for RTL horizontal text.]
*/
                        double advance = result[k].advance;
/*
              Set a =
              min(a, pos, pos
              + advance).


              Set b =
              max(b, pos, pos
              + advance).
*/
                        a = Math.min(a, Math.min(pos, pos + advance));
                        b = Math.max(b, Math.max(pos, pos + advance));
                    }
/*

          If a ≠ +∞ then:

*/
                    if (a != Double.POSITIVE_INFINITY) {
/*

              Find the distance delta = ‘textLength’
              computed value − (b − a).
*/
                        double delta = node.mTextLength.value - (b - a);
/*

            User agents are required to shift the last
            typographic character in the node by
            delta, in the positive x direction
            if the "horizontal" flag is true and if
            direction is
            lrt, in the
            negative x direction if the "horizontal" flag
            is true and direction is
            rtl, or in the
            positive y direction otherwise.  User agents
            are free to adjust intermediate
            typographic characters for optimal
            typography. The next steps indicate one way to
            adjust typographic characters when
            the value of ‘lengthAdjust’ is
            spacing.

              Find n, the total number of
              typographic characters in this node
              TODO including any descendant nodes that are not resolved
              descendant nodes or within a resolved descendant
              node.
*/
                        int n = 0;
                        int resolvedDescendantNodes = 0;
                        for (int c = 0; c < node.getChildCount(); c++) {
                            if (((TextPathView) node.getChildAt(c)).mTextLength == null) {
                                String ccontent = ((TSpanView) node).mContent;
                                n += ccontent == null ? 0 : ccontent.length();
                            } else {
                                result[n].firstCharacterInResolvedDescendant = true;
                                resolvedDescendantNodes++;
                            }
                        }
/*
              Let n = n + number of
              resolved descendant nodes − 1.
*/
                        n += resolvedDescendantNodes - 1;
/*
            Each resolved descendant node is treated as if it
            were a single
            typographic character in this
            context.

              Find the per-character adjustment δ
              = delta/n.

              Let shift = 0.
*/
                        double perCharacterAdjustment = delta / n;
                        double shift = 0;
/*
              For each index k in the range [i,j]:
*/
                        for (int k = i; k <= j; k++) {
/*
              Add shift to the x coordinate of the
              position in result[k], if the "horizontal"
              flag is true, and to the y coordinate
              otherwise.
*/
                            if (horizontal) {
                                result[k].x += shift;
                            } else {
                                result[k].y += shift;
                            }
/*
              If the "middle" flag for result[k]
              is not true and k is not a character in
              a resolved descendant node other than the first
              character then shift = shift
              + δ.
              */
                            if (!result[k].middle && (!result[k].resolved || result[k].firstCharacterInResolvedDescendant)) {
                                shift += perCharacterAdjustment;
                            }
                        }
                    }
                }
            }
        }
        TextLengthResolver lengthResolver = new TextLengthResolver();
        lengthResolver.resolveTextLength(text);
/*

      Adjust positions: x, y

    This loop applies ‘x’ and ‘y’ values,
    and ensures that text-anchor chunks do not start in
    the middle of a typographic character.

      Let shift be the current adjustment due to
      the ‘x’ and ‘y’ attributes,
      initialized to (0,0).

      Set index = 1.
*/
        shift.set(0, 0);
        int index = 1;
/*
      While index < count:
*/
        while (index < count) {
/*
          TODO If resolved_x[index] is set, then let (typo)
          shift.x =
          resolved_x[index] −
          result.x[index].
*/
            if (resolve_x[index] != null) {
                shift.x = (float) (Double.parseDouble(resolve_x[index]) - result[index].x);
            }
/*
          TODO If resolved_y[index] is set, then let (typo)
          shift.y =
          resolved_y[index] −
          result.y[index].
*/
            if (resolve_y[index] != null) {
                shift.y = (float) (Double.parseDouble(resolve_y[index]) - result[index].y);
            }
/*
          Let result.x[index] =
            result.x[index] + shift.x
          and result.y[index] =
        result.y[index] + shift.y.
*/
            result[index].x += shift.x;
            result[index].y += shift.y;
/*
          If the "middle" and "anchored chunk" flags
          of result[index] are both true, then:
*/
            if (result[index].middle && result[index].anchoredChunk) {
/*
          Set the "anchored chunk" flag
          of result[index] to false.
*/
                result[index].anchoredChunk = false;
            }
/*

          If index + 1 < count, then set
          the "anchored chunk" flag
          of result[index + 1] to true.
*/
            if (index + 1 < count) {
                result[index + 1].anchoredChunk = true;
            }
/*
          Set index to index + 1.
*/
            index++;
        }
/*

      Apply anchoring

     TODO For each slice result[i..j]
      (inclusive of both i and j), where:

          the "anchored chunk" flag of result[i]
          is true,

          the "anchored chunk" flags
          of result[k] where i
          < k ≤ j are false, and

          j = count − 1 or the "anchored
          chunk" flag of result[j + 1] is
          true;
      do:

        This loops over each anchored chunk.

          Let a = +∞ and b = −∞.

          For each index k in the range
          [i, j] where the "addressable" flag
          of result[k] is true:

        This loop finds the left-(top-) most and
        right-(bottom-) most extents of the typographic character within the anchored chunk.
*/
        int i = 0;
        double a = Double.POSITIVE_INFINITY;
        double b = Double.NEGATIVE_INFINITY;
        double prevA = Double.POSITIVE_INFINITY;
        double prevB = Double.NEGATIVE_INFINITY;
        for (int k = 0; k < count; k++) {
            if (!result[k].addressable) {
                continue;
            }
            if (result[k].anchoredChunk) {
                prevA = a;
                prevB = b;
                a = Double.POSITIVE_INFINITY;
                b = Double.NEGATIVE_INFINITY;
            }
/*
          Let pos = the x coordinate of the position
          in result[k], if the "horizontal" flag
          is true, and the y coordinate otherwise.

          Let advance = the advance of
          the typographic character corresponding to
          character k. [NOTE: This advance will be
          negative for RTL horizontal text.]

          Set a =
          min(a, pos, pos
          + advance).

          Set b =
          max(b, pos, pos
          + advance).
*/
            double pos = horizontal ? result[k].x : result[k].y;
            double advance = result[k].advance;
            a = Math.min(a, Math.min(pos, pos + advance));
            b = Math.max(b, Math.max(pos, pos + advance));
/*
          If a ≠ +∞, then:

        Here we perform the text anchoring.

          Let shift be the x coordinate of
          result[i], if the "horizontal" flag
          is true, and the y coordinate otherwise.

          TODO Adjust shift based on the value of text-anchor
          TODO and direction of the element the character at
          index i is in:

            (start, ltr) or (end, rtl)
            Set shift = shift − a.
            (start, rtl) or (end, ltr)
            Set shift = shift − b.
            (middle, ltr) or (middle, rtl)
            Set shift = shift − (a + b) / 2.
*/
            if ((k > 0 && result[k].anchoredChunk && prevA != Double.POSITIVE_INFINITY) || k == count - 1) {
                TextAnchor anchor = TextAnchor.start;
                Direction direction = Direction.ltr;

                if (k == count - 1) {
                    prevA = a;
                    prevB = b;
                }

                double anchorShift = horizontal ? result[i].x : result[i].y;
                switch (anchor) {
                    case start:
                        if (direction == Direction.ltr) {
                            anchorShift = anchorShift - prevA;
                        } else {
                            anchorShift = anchorShift - prevB;
                        }
                        break;

                    case middle:
                        if (direction == Direction.ltr) {
                            anchorShift = anchorShift - (prevA + prevB) / 2;
                        } else {
                            anchorShift = anchorShift - (prevA + prevB) / 2;
                        }
                        break;

                    case end:
                        if (direction == Direction.ltr) {
                            anchorShift = anchorShift - prevB;
                        } else {
                            anchorShift = anchorShift - prevA;
                        }
                        break;
                }
/*
          For each index k in the range [i, j]:

              Add shift to the x coordinate of the position
              in result[k], if the "horizontal"
              flag is true, and to the y coordinate otherwise.
*/
                int j = k == count - 1 ? k : k - 1;
                for (int r = i; r <= j; r++) {
                    if (horizontal) {
                        result[r].x += anchorShift;
                    } else {
                        result[r].y += anchorShift;
                    }
                }

                i = k;
            }
        }
/*

      Position on path

      Set index = 0.

      Set the "in path" flag to false.

      Set the "after path" flag to false.

      Let path_end be an offset for characters that follow
      a ‘textPath’ element. Set path_end to (0,0).

      While index < count:
*/
        index = 0;
        boolean inPath = false;
        boolean afterPath = false;
        PointF path_end = new PointF(0, 0);
        Path textPath = null;
        PathMeasure pm = new PathMeasure();
        while (index < count) {
/*
          If the character at index i is within a
          ‘textPath’ element and corresponds to a typographic character, then:

          Set "in path" flag to true.
*/
            final TextPathView textPathView = inTextPath.get(index);
            if (textPathView != null && result[index].addressable) {
                textPath = textPathView.getTextPath(null, null);
                inPath = true;
/*

          If the "middle" flag of
          result[index] is false, then:
*/
                if (!result[index].middle) {
/*
            Here we apply ‘textPath’ positioning.

              Let path be the equivalent path of
              the basic shape element referenced by
              the ‘textPath’ element, or an empty path if
              the reference is invalid.

              If the ‘side’ attribute of
              the ‘textPath’ element is
              'right', then
             TODO reverse path.
*/
                    Path path = textPath;
                    if (textPathView.getSide() == TextPathSide.right) {

                    }
/*
              Let length be the length
              of path.
*/
                    pm.setPath(path, false);
                    double length = pm.getLength();
/*
              Let offset be the value of the
              ‘textPath’ element's
              ‘startOffset’ attribute, adjusted
              due to any ‘pathLength’ attribute on the
              referenced element (if the referenced element is
              a ‘path’ element).
*/
                    double offset = textPathView.getStartOffset().value;
/*
              Let advance = the advance of
              the typographic character corresponding
              to character TODO k. (typo) [NOTE: This advance will
              be negative for RTL horizontal text.]
*/
                    double advance = result[index].advance;
/*
              Let (x, y)
              and angle be the position and angle
              in result[index].
*/
                    double x = result[index].x;
                    double y = result[index].y;
                    double angle = result[index].rotate;
/*

              Let mid be a coordinate value depending
              on the value of the "horizontal" flag:

            true
            mid is x + advance / 2
              + offset
            false
            mid is y + advance / 2
              + offset
*/
                    double mid = (horizontal ? x : y) + advance / 2 + offset;
/*

            The user agent is free to make any additional adjustments to
            mid necessary to ensure high quality typesetting
           TODO due to a ‘spacing’ value of
            'auto' or a
            ‘method’ value of
            'stretch'.

              If path is not a closed subpath and
              mid < 0 or mid > length,
              set the "hidden" flag of result[index] to true.
*/
                    if (!pm.isClosed() && (mid < 0 || mid > length)) {
                        result[index].hidden = true;
                    }
/*
              If path is a closed subpath depending on
              the values of text-anchor and direction of
              the element the character at index is in:
*/
                    if (pm.isClosed()) {
/*
            This implements the special wrapping criteria for single
            closed subpaths.

            (start, ltr) or (end, rtl)

              If mid−offset < 0
              or mid−offset > length,
              set the "hidden" flag of result[index] to true.

            (middle, ltr) or (middle, rtl)

              If
              If mid−offset < −length/2
              or mid−offset >  length/2,
              set the "hidden" flag of result[index] to true.

            (start, rtl) or (end, ltr)

              If mid−offset < −length
              or mid−offset > 0,
              set the "hidden" flag of result[index] to true.
*/
                        TextAnchor anchor = TextAnchor.start;
                        Direction direction = Direction.ltr;

                        double anchorShift = horizontal ? result[i].x : result[i].y;
                        switch (anchor) {
                            case start:
                                if (direction == Direction.ltr) {
                                    if (mid < 0 || mid > length) {
                                        result[index].hidden = true;
                                    }
                                } else {
                                    if (mid < -length || mid > 0) {
                                        result[index].hidden = true;
                                    }
                                }
                                break;

                            case middle:
                                if (mid < -length / 2 || mid > length / 2) {
                                    result[index].hidden = true;
                                }
                                break;

                            case end:
                                if (direction == Direction.ltr) {
                                    if (mid < -length || mid > 0) {
                                        result[index].hidden = true;
                                    }
                                } else {
                                    if (mid < 0 || mid > length) {
                                        result[index].hidden = true;
                                    }
                                }
                                break;
                        }
                    }
/*
            Set mid = mid mod length.
*/
                    mid %= length;
/*
            If the hidden flag is false:
*/
                    if (!result[index].hidden) {
/*
              Let point be the position and
              t be the unit vector tangent to
              the point mid distance
              along path.
*/
                        float[] point = new float[2];
                        float[] t = new float[2];
                        pm.getPosTan((float) mid, point, t);
                        final double tau = 2 * Math.PI;
                        final double radToDeg = 360 / tau;
                        final double r = Math.atan2(t[1], t[0]) * radToDeg;
/*
              If the "horizontal" flag is
*/
                        if (horizontal) {
/*
                true

                  Let n be the normal unit vector
                  pointing in the direction t + 90°.
*/
                            double normAngle = r + 90;
                            double[] n = new double[]{Math.cos(normAngle), Math.sin(normAngle)};
/*
                  Let o be the horizontal distance from the
                  TODO vertical center line of the glyph to the alignment point.
*/
                            double o = 0;
/*
                  Then set the position in
                  result[index] to
                  point -
                  o×t +
                  y×n.

                  Let r be the angle from
                  the positive x-axis to the tangent.

                  Set the angle value
                  in result[index]
                  to angle + r.
*/
                            result[index].rotate += r;
                        } else {
/*
                false

                  Let n be the normal unit vector
                  pointing in the direction t - 90°.
*/
                            double normAngle = r - 90;
                            double[] n = new double[]{Math.cos(normAngle), Math.sin(normAngle)};
/*
                  Let o be the vertical distance from the
                  TODO horizontal center line of the glyph to the alignment point.
*/
                            double o = 0;
/*

                  Then set the position in
                  result[index] to
                  point -
                  o×t +
                  x×n.

                  Let r be the angle from
                  the positive y-axis to the tangent.

                  Set the angle value
                  in result[index]
                  to angle + r.
*/
                            result[index].rotate += r;
                        }
                    }
/*

          Otherwise, the "middle" flag
          of result[index] is true:

              Set the position and angle values
              of result[index] to those
              in result[index − 1].
*/
                } else {
                    result[index].x = result[index - 1].x;
                    result[index].y = result[index - 1].y;
                    result[index].rotate = result[index - 1].rotate;
                }

            }
/*
          If the character at index i is not within a
          ‘textPath’ element and corresponds to a typographic character, then:

        This sets the starting point for rendering any characters that
        occur after a ‘textPath’ element to the end of the path.
*/
            if (textPathView == null && result[index].addressable) {
/*
        If the "in path" flag is true:

              Set the "in path" flag to false.

              Set the "after path" flag to true.

              Set path_end equal to the end point of the path
              referenced by ‘textPath’ − the position of
              result[index].
*/
                if (inPath) {
                    inPath = false;
                    afterPath = true;
                    pm.setPath(textPath, false);
                    float[] pos = new float[2];
                    pm.getPosTan(pm.getLength(), pos, null);
                    path_end.set(pos[0], pos[1]);
                }
/*

          If the "after path" is true.

              If anchored chunk of
              result[index] is true, set the
              "after path" flag to false.

              Else,
              let result.x[index] =
              result.x[index] + path_end.x
              and result.y[index] =
              result.y[index] + path_end.y.
*/
                if (afterPath) {
                    if (result[index].anchoredChunk) {
                        afterPath = false;
                    } else {
                        result[index].x += path_end.x;
                        result[index].y += path_end.y;
                    }
                }
            }
/*

          Set index = index + 1.
*/
            index++;
        }
/*
      Return result
*/
        return result;
    }
}
