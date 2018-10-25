import { GraphQLScalarType } from 'graphql/type';
import { GraphQLError } from 'graphql/error';
import { Kind } from 'graphql/language';

import Cursor from '../cursor';

import UserResolvers from './users';
import ListResolvers from './list';

const validateValue = value => {
  if (isNaN(Date.parse(value))) {
    throw new GraphQLError(`Query error: not a valid date`, [value]);
  }
};

export default {
  Query: {
    getList: ListResolvers.getList,
    lists: ListResolvers.lists,

    /* user queries */
    users: UserResolvers.getAllUsers,
    user: UserResolvers.getUser
  },
  Mutation: {
    signIn: UserResolvers.signIn,
    signUp: UserResolvers.signUp,
    createNewList: ListResolvers.createNewList
  },

  ListConnection: {
    totalCount: p => p.totalCount,
    edges: p => p.edges,
    pageInfo: p => p.pageInfo
  },

  Cursor,

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
