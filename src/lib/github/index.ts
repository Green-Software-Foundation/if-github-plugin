import { z } from 'zod';
import { ERRORS } from '@grnsft/if-core/utils';
import {
  PluginParams,
  ExecutePlugin,
  ConfigParams,
  PluginParametersMetadata,
} from '@grnsft/if-core/types';

import { validate } from '../../util/validations';

import { GithubAPI } from './api';

const { GlobalConfigError } = ERRORS;

export const Github = (
  globalConfig: ConfigParams,
  parametersMetadata: PluginParametersMetadata
): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
    inputs: parametersMetadata?.inputs,
    outputs: parametersMetadata?.outputs || {
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
  };

  /**
   * Gets sizes and clones of the repository.
   */
  const execute = async (inputs: PluginParams[]) => {
    const { repo } = validateGlobalConfig();
    const { clones, size } = await getRepoData(repo);

    return inputs.map((input, index) => {
      const safeInput = Object.assign({}, input, validateInput(input, index));
      const clonesCount = getClonesForTimeRange(safeInput, clones);

      return {
        ...input,
        clones: clonesCount,
        size,
      };
    });
  };

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
    const evaledDuration = eval(duration);
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

  /**
   * Validates single input data.
   */
  const validateInput = (input: PluginParams, index: number) => {
    const schema = z.object({
      timestamp: z
        .string({
          required_error: `required in input[${index}]`,
        })
        .or(z.date()),
      duration: z.number().or(z.string()),
    });

    return validate<z.infer<typeof schema>>(schema, input);
  };

  /**
   * Checks if global config value are valid.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new GlobalConfigError('Global config is not provided.');
    }

    const schema = z.object({
      repo: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/),
    });

    return validate<z.infer<typeof schema>>(schema, globalConfig);
  };

  return {
    metadata,
    execute,
  };
};
