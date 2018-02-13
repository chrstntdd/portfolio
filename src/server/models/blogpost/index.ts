import { Schema, Document, model } from 'mongoose';
import { getServerConfigs } from '../../config';

export interface IBlogPost extends Document {
  title: string;
  content: string;
  author: string;
  wordCount: number;
  thumbnail: string;
  tags: [string];
  published: Date;
  edited: Date;
}

export const blogPostSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  wordCount: {
    type: Number
  },
  thumbnail: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    required: true
  },
  published: {
    type: Date,
    default: Date.now
  },
  edited: {
    type: Date
  }
});

export const blogPostModel = model<IBlogPost>('BlogPost', blogPostSchema);

export default blogPostModel;
