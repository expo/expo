import { cleanCopyValue } from './code';

describe('Code copy', () => {
  it('SlashComments - preserves the fully annotated line', () => {
    expect(
      cleanCopyValue(
        `/* @info Import FontAwesome. */import FontAwesome from "@expo/vector-icons/FontAwesome";/* @end */`
      )
    ).toBe(`import FontAwesome from "@expo/vector-icons/FontAwesome";`);
  });

  it('SlashComments - removes the annotation mid-line', () => {
    expect(
      cleanCopyValue(
        `export default function Button({ label,/* @info The prop theme to detect the button variant. */ theme/* @end */ }) {`
      )
    ).toBe(`export default function Button({ label, theme }) {`);
  });

  it('SlashComments - preserves the line wrapped with annotations', () => {
    expect(
      cleanCopyValue(
        `/* @info This text will be shown onHover */
        return x + 1;
        /* @end */`
      )
    ).toBe(`        return x + 1;
        `);
  });

  it('HashComments - preserves the fully annotated line', () => {
    expect(
      cleanCopyValue(
        `# @info Import FontAwesome. #import FontAwesome from "@expo/vector-icons/FontAwesome";# @end #`
      )
    ).toBe(`import FontAwesome from "@expo/vector-icons/FontAwesome";`);
  });

  it('HashComments - removes the annotation mid-line', () => {
    expect(
      cleanCopyValue(
        `export default function Button({ label,# @info The prop theme to detect the button variant. # theme# @end # }) {`
      )
    ).toBe(`export default function Button({ label, theme }) {`);
  });

  it('HashComments - preserves the line wrapped with annotations', () => {
    expect(
      cleanCopyValue(
        `# @info This text will be shown onHover #
        return x + 1;
        # @end #`
      )
    ).toBe(`        return x + 1;
        `);
  });

  it('XMLComments - preserves the fully annotated line', () => {
    expect(
      cleanCopyValue(
        `<!-- @info Import FontAwesome. -->import FontAwesome from "@expo/vector-icons/FontAwesome";<!-- @end -->`
      )
    ).toBe(`import FontAwesome from "@expo/vector-icons/FontAwesome";`);
  });

  it('XMLComments - removes the annotation mid-line', () => {
    expect(
      cleanCopyValue(
        `export default function Button({ label,<!-- @info The prop theme to detect the button variant. --> theme<!-- @end --> }) {`
      )
    ).toBe(`export default function Button({ label, theme }) {`);
  });

  it('XMLComments - preserves the line wrapped with annotations', () => {
    expect(
      cleanCopyValue(
        `<!-- @info This text will be shown onHover -->
        return x + 1;
        <!-- @end -->`
      )
    ).toBe(`        return x + 1;
        `);
  });
});
