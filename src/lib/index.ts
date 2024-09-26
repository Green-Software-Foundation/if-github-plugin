import { z } from 'zod';

import { PluginParams, ConfigParams } from '@grnsft/if-core/types';
import { PluginFactory } from '@grnsft/if-core/interfaces';
import { ERRORS, validate } from '@grnsft/if-core/utils';

import { GithubAPI } from './api';

const { ConfigError } = ERRORS;

export const Github = PluginFactory({
  metadata: {
    inputs: {},
    outputs: {
      clones: {
        description:
          'the clones count of the given repository in the specified time range',
        unit: 'number',
      },
      size: {
        description: 'the size of the given repository',
        unit: 'GB',
      },
    },
  },
  implementation: async (inputs: PluginParams[], config: ConfigParams) => {
    const { repo } = config;
    const { clones, size } = await getRepoData(repo);

    return inputs.map((input) => ({
      ...input,
      clones: getClonesForTimeRange(input, clones),
      size,
    }));
  },
  inputValidation: (
    input: PluginParams,
    _config: ConfigParams,
    index: number
  ) => {
    const schema = z.object({
      timestamp: z.string().or(z.date()),
      duration: z.number().or(z.string()),
    });

    return validate<z.infer<typeof schema>>(schema, input, index);
  },
  configValidation: (config: ConfigParams) => {
    if (!config || !Object.keys(config)?.length) {
      throw new ConfigError('Config is not provided.');
    }

    const schema = z.object({
      repo: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/),
    });

    return validate<z.infer<typeof schema>>(schema, config);
  },
});

/**
 * Gets repo data from the GitHub API.
 */
const getRepoData = async (repo: string) => {
  const [owner, repoName] = repo.split('/');

  return await GithubAPI().getRepoClonesAndSizes(owner, repoName);
};

/**
 * Gets clones count for the given input data.
 */
const getClonesForTimeRange = (
  input: PluginParams,
  clones: { timestamp: string; count: number }[]
) => {
  const twoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;
  const { timestamp, duration } = input;
  const evaledDuration = eval(duration) * 1000;
  const convertedTimestamp = localToUTC(timestamp);
  const startTime = new Date(convertedTimestamp || timestamp).getTime();
  const endTime = startTime + evaledDuration;

  if (evaledDuration > twoWeeksInMilliseconds) {
    console.warn(
      'The `duration` exceeds two weeks. The GitHub API provides a maximum of 2 weeks of data. The plugin calculated data for two weeks.\n'
    );
  }

  return clones.reduce((totalCount, clone) => {
    const cloneTime = new Date(clone.timestamp).getTime();

    if (cloneTime >= startTime && cloneTime <= endTime) {
      return totalCount + clone.count;
    }

    return totalCount;
  }, 0);
};

/**
 * Converts a local time to an ISO string in UTC format.
 */
const localToUTC = (timestamp: string): string => {
  const date = new Date(timestamp);
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  return utcDate.toISOString();
};
