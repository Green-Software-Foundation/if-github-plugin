# Impact Framework Github Plugin

## Overview

The Github plugin retrieves the count of `clones` and the `size` of a given repository using the GitHub API.

## Implementation

The Github plugin fetches the `clones` and `size` of the specified repository from the GitHub API for each entry in a manifest's input data.

- The `timestamp` and `duration` fields in the input data are used to filter the clone data. The relevant endpoint is documented [here](https://docs.github.com/en/rest/metrics/traffic).
- The GitHub API provides traffic `clones` data for the last **two weeks** only.
- To get the `size` of the repository, the plugin uses [this](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#get-a-repository) endpoint.

## Environment

The GitHub API requires a GitHub personal access token to access repository data. More details can be found [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token). The Github plugin requires the personal access token to be set in the environment variable file with the name `GITHUB_TOKEN`.

## Usage

To run the `Github` plugin, an instance of `ExecutePlugin` must be created. Then, the plugin's `execute()` method can be called, passing required arguments to it.

This is how you could run the model in Typescript:

```typescript
async function runPlugin() {
  const config = {
    repo: 'Green-Software-Foundation/if',
  };
  const parametersMetada = { inputs: {}, outputs: {} };
  const github = Github(config, parametersMetdata, {});
  const usage = await github.execute([
    {
      timestamp: '2024-07-05T00:00',
      duration: 126000,
    },
  ]);

  console.log(usage);
}

runPlugin();
```

## Config

- `repo`: (required) specifies the name of the organization (or owner) and repository name, combined with `/`, e.g. `Green-Software-Foundation/if`

## Input Parameters

- `timestamp`: (required) specifies the start of the time range for retrieving data from the GitHub API. Note that the GitHub API provides data only for last two weeks, so the `timestamp` should be no earlier than 2 weeks ago.
- `duration`: (required) specifies the end of the time range for retrieving data from the API. It can be either number or string like `14 * 24 * 60 * 60`.

## Mapping

The `mapping` block is an optional block. It is added in the plugin section and allows the plugin to map the output parameters of the plugin. The structure of the `mapping` block is:

```yaml
github-plugin:
  path: if-github-plugin
  method: Github
  mapping:
    'size': 'repo-size-if'
    'clones': 'repo-clones-if'
```

## Output

- `size`: output the size of the given repository, represented in `GB`.
- `clones`: output the clones count of the given repository in the specified time range.

## Error Handling

The plugin can throw the following errors:

- `APIRequestError`: caused by a problem retrieving data from the API. The error message returned from the API is echoed in the IF error message.
- `AuthorizationError`: occurs when either the `GITHUB_TOKEN` is not provided in the environment variables or the `GITHUB_TOKEN` is invalid.

## Integration into Impact Framework

Clone this repository to your local machine to play with a local copy. In the project root run `npm run build && npm link`.

This creates a package with global scope on your local machine that can be installed by your instance of Impact Framework.

Navigate to the Impact Framework root, and run `npm link if-github-plugin`.

Now, you can use the plugin by including it in your manifest file as follows:

```yaml
name: github demo
description:
tags:
initialize:
  plugins:
    github-plugin:
      method: Github
      path: if-github-plugin
      config:
        repo: Green-Software-Foundation/if
tree:
  children:
    github:
      pipeline:
        compute:
          - github-plugin
      defaults:
      inputs:
        - timestamp: 2024-07-05T00:00
          duration: 14 * 24 * 60 * 60 * 1000
```

Now, when you run the `manifest` using the IF CLI, it will load the model automatically. Run using:

```sh
if-run -m <path-to-your-manifest>
```

## References

The plugin simply grabs data for a given repository from the github.com API.

- To calculate `clones`, the plugin uses [traffic](https://docs.github.com/en/rest/metrics/traffic) endpoint.
- To get `size` of the repository, the plugin uses [get a repository](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#get-a-repository) endpoint.
