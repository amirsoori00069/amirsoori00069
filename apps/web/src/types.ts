export type Item = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type Section = {
  id: string;
  title: string;
  sortOrder: number;
  items: Item[];
};

export type Note = {
  id: string;
  itemId: string;
  displayName: string;
  body: string;
  createdAt: string;
};
