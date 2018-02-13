import { GraphQLScalarType, GraphQLError } from 'graphql';
import { Kind } from 'graphql/language';

import PostResolvers from './blogpost';
import UserResolvers from './user';

const validateValue = value => {
  if (isNaN(Date.parse(value))) {
    throw new GraphQLError(`Query error: not a valid date`, [value]);
  }
};

export default {
  Query: {
    /* post queries */
    getAllUserPosts: PostResolvers.getAllUserPosts,
    getUserPost: PostResolvers.getUserPost
  },
  Mutation: {
    /* post mutations */
    createPost: PostResolvers.createPost,
    updatePost: PostResolvers.updatePost,
    deletePost: PostResolvers.deletePost
  },

  /* 
   * alternate implementation that provides the date back as an int
   * new Date(1507509411918) -> Sun Oct 08 2017 20:36:51 GMT-0400 (Eastern Daylight Time)
   * http://dev.apollodata.com/tools/graphql-tools/scalars.html#Date-as-a-scalar
   * 
   * this implementation thanks to:
   * https://marmelab.com/blog/2017/09/06/dive-into-graphql-part-iii-building-a-graphql-server-with-nodejs.html#managing-custom-scalar-types
   */

  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Custom date scalar type',
    parseValue(value) {
      // value comes from the client, in variables
      validateValue(value);
      return new Date(value); // sent to resolvers
    },
    parseLiteral(ast) {
      // value comes from the client, inlined in the query
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError(`Query error: Can only parse dates strings, got a: ${ast.kind}`, [
          ast
        ]);
      }
      validateValue(ast.value);
      return new Date(ast.value); // sent to resolvers
    },
    serialize(value) {
      // value comes from resolvers
      return value.toISOString(); // sent to the client
    }
  })
};
