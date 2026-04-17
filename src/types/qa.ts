export interface QAData {
  _id?: string;
  question: string;
  answer: string;
  answeredByModel: string;
  relatedEpisodeSlugs: string[];
  relatedVerses: string[];
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
