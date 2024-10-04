import * as dotenv from 'dotenv';
import axios from 'axios';

import {ERRORS} from '@grnsft/if-core/utils';

import {ClonesResponse, SizeResponse} from './types';

const {AuthorizationError, APIRequestError} = ERRORS;

dotenv.config();

export const GithubAPI = () => {
  const token = process.env.GITHUB_TOKEN;
  const githubAPI = axios.create({
    baseURL: 'https://api.github.com/',
    headers: {
      Authorization: `token ${token}`,
    },
  });

  githubAPI?.interceptors?.response?.use(
    response => response.data,
    error => {
      if (error.response) {
        throw new APIRequestError(
          `Error fetching data from GitHub API. Status: ${error.response.status}, Message: ${error.response.statusText}`
        );
      } else if (error.request) {
        throw new APIRequestError(
          `No response received from GitHub API. ${error.message}`
        );
      } else {
        throw new APIRequestError(`Request error: ${error.message}`);
      }
    }
  );

  /**
   * Gets sizes and clones of the specified owner's repo.
   */
  const getRepoClonesAndSizes = async (owner: string, repo: string) => {
    if (!token) {
      throw new AuthorizationError(
        'Token does not persist in the environment variables.'
      );
    }

    await checkTokenValidity(token);
    await checkOwnerValidity(owner);

    const clones = await getRepoClones(owner, repo);
    const size = await getRepoSizeInGB(owner, repo);

    return {
      clones,
      size,
    };
  };

  /**
   * Checks if the given `token` is valid.
   */
  const checkTokenValidity = async (token: string) => {
    try {
      return await githubAPI.get('user');
    } catch (error) {
      throw new AuthorizationError(
        `Provided token: ${token} is invalid. ${error}`
      );
    }
  };

  /**
   * Checks if the given `owner` is valid.
   */
  const checkOwnerValidity = async (owner: string) => {
    try {
      return await githubAPI.get(`orgs/${owner}`);
    } catch (error) {
      throw new APIRequestError(
        `Error fetching owner: ${owner} from GitHub API. ${error}`
      );
    }
  };

  /**
   * Gets specified repo clones.
   */
  const getRepoClones = async (owner: string, repo: string) => {
    try {
      const result = await githubAPI.get<ClonesResponse, any>(
        `repos/${owner}/${repo}/traffic/clones`
      );

      return result?.clones;
    } catch (error) {
      throw new APIRequestError(
        `Error fetching clones from GitHub API for owner: ${owner} and repo: ${repo}. ${error}`
      );
    }
  };

  /**
   * Gets specified repo data and retrives the `size` property which is in `kilobytes`, and converts it to `GB`.
   */
  const getRepoSizeInGB = async (owner: string, repo: string) => {
    try {
      const result = await githubAPI.get<SizeResponse, any>(
        `repos/${owner}/${repo}`
      );
      return result?.size / (1000 * 1000);
    } catch (error) {
      throw new APIRequestError(
        `Error fetching size from GitHub API for owner: ${owner} and repo: ${repo}. ${error}`
      );
    }
  };

  return {
    getRepoClonesAndSizes,
  };
};
