# Paths Changes Filter

[GitHub Action](https://github.com/features/actions) that enables conditional execution of workflow steps and jobs, based on the files modified by pull request, on a feature
branch, or by the recently pushed commits.

Run slow tasks like integration tests or deployments only for changed components. It saves time and resources, especially in monorepo setups.
GitHub workflows built-in [path filters](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#onpushpull_requestpaths)
don't allow this because they don't work on a level of individual jobs or steps.

**Real world usage examples:**

- [sentry.io](https://sentry.io/) - [backend.yml](https://github.com/getsentry/sentry/blob/2ebe01feab863d89aa7564e6d243b6d80c230ddc/.github/workflows/backend.yml#L36)
- [GoogleChrome/web.dev](https://web.dev/) - [lint-workflow.yml](https://github.com/GoogleChrome/web.dev/blob/3a57b721e7df6fc52172f676ca68d16153bda6a3/.github/workflows/lint-workflow.yml#L26)
- [blog post Configuring python linting to be part of CI/CD using GitHub actions](https://dev.to/freshbooks/configuring-python-linting-to-be-part-of-cicd-using-github-actions-1731#what-files-does-it-run-against) - [py_linter.yml](https://github.com/iamtodor/demo-github-actions-python-linter-configuration/blob/main/.github/workflows/py_linter.yml#L31)

## Supported workflows

- **Pull requests:**
  - Workflow triggered by **[pull_request](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request)**
    or **[pull_request_target](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request_target)** event
  - Changes are detected against the pull request base branch
  - Uses GitHub REST API to fetch a list of modified files
  - Requires [pull-requests: read](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs) permission
- **Feature branches:**
  - Workflow triggered by **[push](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#push)**
  or any other **[event](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows)**
  - The `base` input parameter must not be the same as the branch that triggered the workflow
  - Changes are detected against the merge-base with the configured base branch or the default branch
  - Uses git commands to detect changes - repository must be already [checked out](https://github.com/actions/checkout)
- **Master, Release, or other long-lived branches:**
  - Workflow triggered by **[push](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#push)** event
  when `base` input parameter is the same as the branch that triggered the workflow:
    - Changes are detected against the most recent commit on the same branch before the push
  - Workflow triggered by any other **[event](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows)**
  when `base` input parameter is commit SHA:
    - Changes are detected against the provided `base` commit
  - Workflow triggered by any other **[event](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows)**
  when `base` input parameter is the same as the branch that triggered the workflow:
    - Changes are detected from the last commit
  - Uses git commands to detect changes - repository must be already [checked out](https://github.com/actions/checkout)
- **Local changes**
  - Workflow triggered by any event when `base` input parameter is set to `HEAD`
  - Changes are detected against the current HEAD
  - Untracked files are ignored

## Example

```yaml
- uses: dorny/paths-filter@v3
  id: changes
  with:
    filters: |
      src:
        - 'src/**'

  # run only if some file in 'src' folder was changed
- if: steps.changes.outputs.src == 'true'
  run: ...
```

For more scenarios see [examples](#examples) section.

## Notes

- Paths expressions are evaluated using [picomatch](https://github.com/micromatch/picomatch) library.
  Documentation for path expression format can be found on the project GitHub page.
- Picomatch [dot](https://github.com/micromatch/picomatch#options) option is set to true.
  Globbing will also match paths where file or folder name starts with a dot.
- It's recommended to quote your path expressions with `'` or `"`. Otherwise, you will get an error if it starts with `*`.
- Local execution with [act](https://github.com/nektos/act) works only with alternative runner image. Default runner doesn't have `git` binary.
  - Use: `act -P ubuntu-latest=nektos/act-environments-ubuntu:18.04`

## What's New

- New major release `v3` after update to Node 20 [Breaking change]
- Add `ref` input parameter
- Add `list-files: csv` format
- Configure matrix job to run for each folder with changes using `changes` output
- Improved listing of matching files with `list-files: shell` and `list-files: escape` options
- Paths expressions are now evaluated using [picomatch](https://github.com/micromatch/picomatch) library

For more information, see [CHANGELOG](https://github.com/dorny/paths-filter/blob/master/CHANGELOG.md)

## Usage

```yaml
- uses: dorny/paths-filter@v3
  with:
    # Defines filters applied to detected changed files.
    # Each filter has a name and a list of rules.
    # Rule is a glob expression - paths of all changed
    # files are matched against it.
    # Rule can optionally specify if the file
    # should be added, modified, or deleted.
    # For each filter, there will be a corresponding output variable to
    # indicate if there's a changed file matching any of the rules.
    # Optionally, there can be a second output variable
    # set to list of all files matching the filter.
    # Filters can be provided inline as a string (containing valid YAML document),
    # or as a relative path to a file (e.g.: .github/filters.yaml).
    # Filters syntax is documented by example - see examples section.
    filters: ''

    # Branch, tag, or commit SHA against which the changes will be detected.
    # If it references the same branch it was pushed to,
    # changes are detected against the most recent commit before the push.
    # Otherwise, it uses git merge-base to find the best common ancestor between
    # current branch (HEAD) and base.
    # When merge-base is found, it's used for change detection - only changes
    # introduced by the current branch are considered.
    # All files are considered as added if there is no common ancestor with
    # base branch or no previous commit.
    # This option is ignored if action is triggered by pull_request event.
    # Default: repository default branch (e.g. master)
    base: ''

    # Git reference (e.g. branch name) from which the changes will be detected.
    # Useful when workflow can be triggered only on the default branch (e.g. repository_dispatch event)
    # but you want to get changes on a different branch.
    # This option is ignored if action is triggered by pull_request event.
    # default: ${{ github.ref }}
    ref:

    # How many commits are initially fetched from the base branch.
    # If needed, each subsequent fetch doubles the
    # previously requested number of commits until the merge-base
    # is found, or there are no more commits in the history.
    # This option takes effect only when changes are detected
    # using git against base branch (feature branch workflow).
    # Default: 100
    initial-fetch-depth: ''

    # Enables listing of files matching the filter:
    #   'none'  - Disables listing of matching files (default).
    #   'csv'   - Coma separated list of filenames.
    #             If needed, it uses double quotes to wrap filename with unsafe characters.
    #   'json'  - File paths are formatted as JSON array.
    #   'shell' - Space delimited list usable as command-line argument list in Linux shell.
    #             If needed, it uses single or double quotes to wrap filename with unsafe characters.
    #   'escape'- Space delimited list usable as command-line argument list in Linux shell.
    #             Backslash escapes every potentially unsafe character.
    # Default: none
    list-files: ''

    # Relative path under $GITHUB_WORKSPACE where the repository was checked out.
    working-directory: ''

    # Personal access token used to fetch a list of changed files
    # from GitHub REST API.
    # It's only used if action is triggered by a pull request event.
    # GitHub token from workflow context is used as default value.
    # If an empty string is provided, the action falls back to detect
    # changes using git commands.
    # Default: ${{ github.token }}
    token: ''

    # Optional parameter to override the default behavior of file matching algorithm. 
    # By default files that match at least one pattern defined by the filters will be included.
    # This parameter allows to override the "at least one pattern" behavior to make it so that
    # all of the patterns have to match or otherwise the file is excluded. 
    # An example scenario where this is useful if you would like to match all 
    # .ts files in a sub-directory but not .md files. 
    # The filters below will match markdown files despite the exclusion syntax UNLESS 
    # you specify 'every' as the predicate-quantifier parameter. When you do that, 
    # it will only match the .ts files in the subdirectory as expected.
    #
    # backend:
    #  - 'pkg/a/b/c/**'
    #  - '!**/*.jpeg'
    #  - '!**/*.md'
    predicate-quantifier: 'some'
```

## Outputs

- For each filter, it sets output variable named by the filter to the text:
  - `'true'` - if **any** of changed files matches any of filter rules
  - `'false'` - if **none** of changed files matches any of filter rules
- For each filter, it sets an output variable with the name `${FILTER_NAME}_count` to the count of matching files.
- If enabled, for each filter it sets an output variable with the name `${FILTER_NAME}_files`. It will contain a list of all files matching the filter.
- `changes` - JSON array with names of all filters matching any of the changed files.

## Examples

### Conditional execution

<details>
  <summary>Execute <b>step</b> in a workflow job only if some file in a subfolder is changed</summary>

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          backend:
            - 'backend/**'
          frontend:
            - 'frontend/**'

    # run only if 'backend' files were changed
    - name: backend tests
      if: steps.filter.outputs.backend == 'true'
      run: ...

    # run only if 'frontend' files were changed
    - name: frontend tests
      if: steps.filter.outputs.frontend == 'true'
      run: ...

    # run if 'backend' or 'frontend' files were changed
    - name: e2e tests
      if: steps.filter.outputs.backend == 'true' || steps.filter.outputs.frontend == 'true'
      run: ...
```

</details>

<details>
  <summary>Execute <b>job</b> in a workflow only if some file in a subfolder is changed</summary>

```yml
jobs:
  # JOB to run change detection
  changes:
    runs-on: ubuntu-latest
    # Required permissions
    permissions:
      pull-requests: read
    # Set job outputs to values from filter step
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
    # For pull requests it's not necessary to checkout the code
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          backend:
            - 'backend/**'
          frontend:
            - 'frontend/**'

  # JOB to build and test backend code
  backend:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - ...

  # JOB to build and test frontend code
  frontend:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - ...
```

</details>

<details>
<summary>Use change detection to configure matrix job</summary>

```yaml
jobs:
  # JOB to run change detection
  changes:
    runs-on: ubuntu-latest
    # Required permissions
    permissions:
      pull-requests: read
    outputs:
      # Expose matched filters as job 'packages' output variable
      packages: ${{ steps.filter.outputs.changes }}
    steps:
    # For pull requests it's not necessary to checkout the code
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          package1: src/package1
          package2: src/package2

  # JOB to build and test each of modified packages
  build:
    needs: changes
    strategy:
      matrix:
        # Parse JSON array containing names of all filters matching any of changed files
        # e.g. ['package1', 'package2'] if both package folders contains changes
        package: ${{ fromJSON(needs.changes.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - ...
```

</details>

### Change detection workflows

<details>
  <summary><b>Pull requests:</b> Detect changes against PR base branch</summary>

```yaml
on:
  pull_request:
    branches: # PRs to the following branches will trigger the workflow
      - master
      - develop
jobs:
  build:
    runs-on: ubuntu-latest
    # Required permissions
    permissions:
      pull-requests: read
    steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: ... # Configure your filters
```

</details>

<details>
  <summary><b>Feature branch:</b> Detect changes against configured base branch</summary>

```yaml
on:
  push:
    branches: # Push to following branches will trigger the workflow
      - feature/**
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        # This may save additional git fetch roundtrip if
        # merge-base is found within latest 20 commits
        fetch-depth: 20
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        base: develop # Change detection against merge-base with this branch
        filters: ... # Configure your filters
```

</details>

<details>
  <summary><b>Long lived branches:</b> Detect changes against the most recent commit on the same branch before the push</summary>

```yaml
on:
  push:
    branches: # Push to the following branches will trigger the workflow
      - master
      - develop
      - release/**
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        # Use context to get the branch where commits were pushed.
        # If there is only one long-lived branch (e.g. master),
        # you can specify it directly.
        # If it's not configured, the repository default branch is used.
        base: ${{ github.ref }}
        filters: ... # Configure your filters
```

</details>

<details>
  <summary><b>Local changes:</b> Detect staged and unstaged local changes</summary>

```yaml
on:
  push:
    branches: # Push to following branches will trigger the workflow
      - master
      - develop
      - release/**
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

      # Some action that modifies files tracked by git (e.g. code linter)
    - uses: johndoe/some-action@v1

      # Filter to detect which files were modified
      # Changes could be, for example, automatically committed
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        base: HEAD
        filters: ... # Configure your filters
```

</details>

### Advanced options

<details>
  <summary>Define filter rules in own file</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # Path to file where filters are defined
        filters: .github/filters.yaml
```

</details>

<details>
  <summary>Use YAML anchors to reuse path expression(s) inside another rule</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # &shared is YAML anchor,
        # *shared references previously defined anchor
        # src filter will match any path under common, config and src folders
        filters: |
          shared: &shared
            - common/**
            - config/**
          src:
            - *shared
            - src/**
```

</details>

<details>
  <summary>Consider if file was added, modified or deleted</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # Changed file can be 'added', 'modified', or 'deleted'.
        # By default, the type of change is not considered.
        # Optionally, it's possible to specify it using nested
        # dictionary, where the type of change composes the key.
        # Multiple change types can be specified using `|` as the delimiter.
        filters: |
          shared: &shared
            - common/**
            - config/**
          addedOrModified:
            - added|modified: '**'
          allChanges:
            - added|deleted|modified: '**'
          addedOrModifiedAnchors:
            - added|modified: *shared
```

</details>

<details>
  <summary>Detect changes in folder only for some file extensions</summary>

```yaml
- uses: dorny/paths-filter@v3
      id: filter
      with:
        # This makes it so that all the patterns have to match a file for it to be
        # considered changed. Because we have the exclusions for .jpeg and .md files
        # the end result is that if those files are changed they will be ignored
        # because they don't match the respective rules excluding them.
        #
        # This can be leveraged to ensure that you only build & test software changes
        # that have real impact on the behavior of the code, e.g. you can set up your
        # build to run when Typescript/Rust/etc. files are changed but markdown
        # changes in the diff will be ignored and you consume less resources to build.
        predicate-quantifier: 'every'
        filters: |
          backend:
            - 'pkg/a/b/c/**'
            - '!**/*.jpeg'
            - '!**/*.md'
```

</details>

### Custom processing of changed files

<details>
  <summary>Passing list of modified files as command line args in Linux shell</summary>

```yaml
- uses: dorny/paths-filter@v3
  id: filter
  with:
    # Enable listing of files matching each filter.
    # Paths to files will be available in `${FILTER_NAME}_files` output variable.
    # Paths will be escaped and space-delimited.
    # Output is usable as command-line argument list in Linux shell
    list-files: shell

    # In this example changed files will be checked by linter.
    # It doesn't make sense to lint deleted files.
    # Therefore we specify we are only interested in added or modified files.
    filters: |
      markdown:
        - added|modified: '*.md'
- name: Lint Markdown
  if: ${{ steps.filter.outputs.markdown == 'true' }}
  run: npx textlint ${{ steps.filter.outputs.markdown_files }}
```

</details>

<details>
  <summary>Passing list of modified files as JSON array to another action</summary>

```yaml
- uses: dorny/paths-filter@v3
  id: filter
  with:
    # Enable listing of files matching each filter.
    # Paths to files will be available in `${FILTER_NAME}_files` output variable.
    # Paths will be formatted as JSON array
    list-files: json

    # In this example all changed files are passed to the following action to do
    # some custom processing.
    filters: |
      changed:
        - '**'
- name: Lint Markdown
  uses: johndoe/some-action@v1
  with:
    files: ${{ steps.filter.outputs.changed_files }}
```

</details>

## See also

- [test-reporter](https://github.com/dorny/test-reporter) - Displays test results from popular testing frameworks directly in GitHub

## License

The scripts and documentation in this project are released under the [MIT License](https://github.com/dorny/paths-filter/blob/master/LICENSE)
