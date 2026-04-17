import type { AuthorLens } from "./episode";

export type { AuthorLens };
export type GlossaryCategory = "contemplative" | "biblical" | "mindfulness" | "general";

export interface GlossaryTermData {
  _id?: string;
  termVi: string;
  termEn: string;
  definition: string;
  relatedVerses: string[];
  category: GlossaryCategory;
  relatedAuthors: AuthorLens[];
  createdAt?: Date;
  updatedAt?: Date;
}
