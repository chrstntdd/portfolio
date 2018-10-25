import { Types, Query } from 'mongoose';

import { GraphQlContext } from '../../';
import { listModel as List, itemModel as Item, userModel as User } from '../../models';

import { verifyJwt } from '../../utils';

interface Paginateable {
  first?: number;
  last?: number;
  before?: string;
  after?: string;
  sortBy?: any;
}

export default {
  /* --------------------------- */
  /* -------- MUTATIONS -------- */
  /* --------------------------- */
  createNewList: async (
    _,
    { input: { name, priv = false, items } },
    { request }: GraphQlContext
  ) => {
    try {
      let initialItems = [];
      const { userId } = await verifyJwt(request);

      if (items) {
        items.forEach(item => {
          initialItems.push(new Item({ _id: new Types.ObjectId(), ...item }).save());
        });
      }

      const newList = await new List({
        items: await Promise.all(initialItems),
        owner: userId,
        name,
        private: priv
      }).save();

      /* update the user by pushing in the newly created list to their existing lists */
      await User.findByIdAndUpdate(userId, { $push: { lists: newList } });

      return newList.populate('items');
    } catch (error) {
      throw error;
    }
  },
  updateList: async (_, { listId }) => {
    /*  */
  },
  deleteList: async (_, { listId }) => {
    /*  */
  },
  /* ------------------------- */
  /* -------- QUERIES -------- */
  /* ------------------------- */
  getList: async (_, { id }) => {
    /*  */
  },
  /**
   * @description
   * Get lists for an authenticated user. Collection can be
   * queried for `first` and `last` slices.
   */
  lists: async (_, { first, last, before, after }: Paginateable, { request }: GraphQlContext) => {
    const { userId } = await verifyJwt(request);
    let totalCount = null;

    /**
     * after is used when paginating `forwards` in a collection
     * before is used when paginating `backwards` in a collection
     */
    const params = after ? { _id: { $gt: after } } : before ? { _id: { $lt: before } } : {};

    const q: Query<any> = List.find({ owner: userId, ...params });

    totalCount = !totalCount ? await List.estimatedDocumentCount() : totalCount;

    q.sort({ createdAt: last ? -1 : 1 })
      .limit(first || last)
      .populate({
        path: 'items'
      });

    const res = await q;
    const edges = res.map(doc => ({ node: doc, cursor: doc.id }));

    return {
      edges,
      pageInfo: {
        hasNextPage: !!(first && totalCount > first),
        hasPrevPage: !!(last && totalCount > last)
      },
      totalCount
    };
  }
};
