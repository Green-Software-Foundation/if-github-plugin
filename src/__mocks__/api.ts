export const getMockResponse = (url: string) => {
  const owner = 'Green-Software-Foundation';
  const repo = 'if';

  switch (url) {
    case 'user':
      return Promise.resolve({});
    case `orgs/${owner}`:
      return Promise.resolve({});
    case `repos/${owner}/${repo}/traffic/clones`:
      return Promise.resolve({
        status: 200,
        clones: [
          {
            count: 12,
            timestamp: '2024-07-05T00:00',
          },
        ],
      });
    case `repos/${owner}/${repo}`:
      return Promise.resolve({
        status: 200,
        size: 120,
      });
  }
  return Promise.resolve({});
};
