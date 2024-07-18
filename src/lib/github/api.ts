import * as dotenv from 'dotenv';
import axios from 'axios';

import { ERRORS } from '../../util/errors';

const { AuthorizationError, APIRequestError } = ERRORS;

dotenv.config();

export const GithubAPI = () => {
  /**
   * Gets sizes and clones of the specified owner's repo.
   */
  const getRepoClonesAndSizes = async (owner: string, repo: string) => {
    const token = process.env.GITHUB_TOKEN;
    axios.defaults.headers.common['Authorization'] = `token ${token}`;

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
      return await axios.get('https://api.github.com/user');
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
      return await axios.get(`https://api.github.com/orgs/${owner}`);
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
      const result = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/traffic/clones`
      );

      if (result?.status !== 200) {
        throw new APIRequestError(
          `Error fetching clones from GitHub API for owner: ${owner} and repo: ${repo}. ${JSON.stringify(result?.status)}`
        );
      }

      return result?.data.clones;
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
      const result = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`
      );

      if (result?.status !== 200) {
        throw new APIRequestError(
          `Error fetching size from GitHub API for owner: ${owner} and repo: ${repo}. ${JSON.stringify(result.status)}`
        );
      }

      return result?.data?.size / (1000 * 1000);
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
