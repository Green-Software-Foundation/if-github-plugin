import axios from 'axios';
import {ERRORS} from '@grnsft/if-core/utils';

import {Github} from '../../../lib';

import {getMockResponse} from '../../../__mocks__/api';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;
const {ConfigError} = ERRORS;

mockAxios.create = jest.fn(() => mockAxios);
mockAxios.get.mockImplementation(getMockResponse);

describe('lib/github: ', () => {
  const originalProcessEnv = process.env;
  const spy = jest.spyOn(global.console, 'warn');
  const parametersMetadata = {
    inputs: {},
    outputs: {},
  };

  beforeAll(() => {
    process.env.GITHUB_TOKEN = 'mock-token';
  });

  afterAll(() => {
    process.env = originalProcessEnv;
    spy.mockReset();
  });

  describe('Github(): ', () => {
    const config = {
      repo: 'Green-Software-Foundation/if',
    };

    it('has metadata field.', () => {
      const github = Github({}, parametersMetadata, {});

      expect.assertions(3);
      expect(github).toHaveProperty('metadata');
      expect(github).toHaveProperty('execute');
      expect(typeof github.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('executes with the correct data.', async () => {
        const github = Github(config, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-05T00:00',
            duration: 126000,
          },
        ];

        const response = await github.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach(item => {
          expect(item).toHaveProperty('clones');
          expect(item).toHaveProperty('size');
        });
      });

      it('successfully executes when the mapping maps output parameters.', async () => {
        const mapping = {
          size: 'repo-size-if',
          clones: 'repo-clones-if',
        };
        const github = Github(config, parametersMetadata, mapping);
        const inputs = [
          {
            timestamp: '2024-07-05T00:00',
            duration: 14 * 24 * 60 * 60,
          },
        ];

        const response = await github.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach(item => {
          expect(item).toHaveProperty('repo-clones-if');
          expect(item).toHaveProperty('repo-size-if');
        });
      });

      it('executes with the correct data when the `duration` is exceed 14 days.', async () => {
        const github = Github(config, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-05T00:00',
            duration: 15 * 24 * 60 * 60,
          },
        ];

        await github.execute(inputs);
        expect.assertions(1);

        expect(spy).toHaveBeenCalledWith(
          'The `duration` exceeds two weeks. The GitHub API provides a maximum of 2 weeks of data. The plugin calculated data for two weeks.\n'
        );
      });

      it('throws an error when config is an empty object.', async () => {
        const github = Github({}, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-05T00:00',
            duration: 126000,
          },
        ];

        expect.assertions(2);
        try {
          await github.execute(inputs);
        } catch (error) {
          if (error instanceof Error) {
            expect(error).toBeInstanceOf(ConfigError);
            expect(error.message).toEqual('Config is not provided.');
          }
        }
      });
    });
  });
});
