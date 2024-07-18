export const getMockResponse = (url: string) => {
  const owner = 'Green-Software-Foundation';
  const repo = 'if';

  switch (url) {
    case 'https://api.github.com/user':
      return Promise.resolve({});
    case `https://api.github.com/orgs/${owner}`:
      return Promise.resolve({});
    case `https://api.github.com/repos/${owner}/${repo}/traffic/clones`:
      return Promise.resolve({
        status: 200,
        data: {
          clones: [
            {
              count: 12,
              timestamp: '2024-07-05T00:00',
            },
          ],
        },
      });
    case `https://api.github.com/repos/${owner}/${repo}`:
      return Promise.resolve({
        status: 200,
        data: {
          size: 120,
        },
      });
  }
  return Promise.resolve({});
};
