import { Schema, Document, model } from 'mongoose';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';

import { getServerConfigs } from '../../config';
import { IBlogPost, blogPostSchema } from '../blogpost';

const SALT_FACTOR = 13;
const { jwtExpiration, jwtSecret } = getServerConfigs();

const hashPassword = async (password: string): Promise<string> => {
  try {
    !password && null;
    return await hash(password, SALT_FACTOR);
  } catch (err) {
    console.log(err);
  }
};

export interface IUser extends Document {
  username: String;
  password: String;
  email: String;
  firstName: String;
  lastName: String;
  accountCreated: Date;
  blogPosts: [IBlogPost];
}

export const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  accountCreated: {
    type: Date,
    default: Date.now
  },
  blogPosts: [blogPostSchema]
});

userSchema.pre('save', async function(next) {
  try {
    /* if the user's password isn't modified, don't re-hash the password */
    !this.isModified('password') && next();

    /* hash that MF thang */
    this.password = await hashPassword(this.password);

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.pre('findOneAndUpdate', async function(next) {
  const password = await hashPassword(this.getUpdate().$set.password);

  if (!password) {
    return;
  }

  this.findOneAndUpdate({}, { password });
});

userSchema.methods.authUser = async function(password: string): Promise<Boolean> {
  try {
    return await compare(password, this.password);
  } catch (error) {
    console.log(error);
  }
};

userSchema.methods.createToken = (id: string): string =>
  sign({ id }, jwtSecret, { expiresIn: jwtExpiration });

const userModel = model<IUser>('User', userSchema);

export default userModel;
