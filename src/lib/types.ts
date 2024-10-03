type Clone = {
  count: number;
  uniques: number;
  timestamp: string;
};

export type ClonesResponse = {
  clones: Clone[];
  count: number;
};

export type SizeResponse = {
  size: number;
};
