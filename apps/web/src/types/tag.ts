export interface Tag {
  id: string;
  userId: string | null;
  name: string;
  color: string;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TagCreateInput = Pick<Tag, 'name' | 'color'>;
