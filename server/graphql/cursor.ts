import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

const toCursor = ({ value }) => Buffer.from(value).toString('base64');

const fromCursor = (cursor: string) => Buffer.from(cursor, 'base64').toString('ascii');

const CursorType = new GraphQLScalarType({
  name: 'Cursor',
  serialize(value) {
    if (value.value) return toCursor(value);
    else return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return fromCursor(ast.value);
    else return null;
  },
  parseValue(value) {
    return fromCursor(value);
  }
});

export default CursorType;

export { toCursor, fromCursor };
