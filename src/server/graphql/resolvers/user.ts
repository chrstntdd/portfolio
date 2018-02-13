import { default as User, userSchema } from '../../models/user';

export default {
  signup: async (_, { email, username, password, firstName, lastName }) => {
    const newUser = await new User({
      email,
      username,
      password,
      firstName,
      lastName
    }).save();

    return newUser.createToken(newUser._id);
  },

  signin: async (_, { email, password }) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('There is no user with that email');
    } else if (!await user.authUser(password)) {
      throw new Error('Incorrect email or password');
    } else {
      return user.createToken(user._id);
    }
  },

  getAllUsers: async () => {
    const allUsers = await User.find();
    if (!allUsers) {
      throw new Error('There are no users');
    } else {
      return allUsers;
    }
  },

  getUser: async (_, { id }) => {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("That user doesn't exist, boi");
    } else {
      return user;
    }
  },

  updateUser: async (_, { id, ...args }) => {
    try {
      return await User.findByIdAndUpdate(id, { $set: args }, { new: true });
    } catch (err) {
      throw new Error(err);
    }
  },

  deleteUser: async (_, { id }) => {
    try {
      return await User.findByIdAndRemove(id);
    } catch (err) {
      throw new Error(err);
    }
  }
};
