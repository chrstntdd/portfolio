import { Request } from 'express'
import { sign } from 'jsonwebtoken'
import { promisify } from 'util'

import { ApiError } from './config/error'

let verify = promisify(require('jsonwebtoken').verify)

import { JWT_SECRET } from './config'

let signToken = id => sign({ userId: id }, JWT_SECRET, { expiresIn: '1d' })

let verifyJwt = async (req: Request) => {
  let token

  if (req.headers.authorization && req.headers.authorization.includes('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  try {
    /* returns the decoded token value */
    return await verify(token, JWT_SECRET)
  } catch ({ message }) {
    /* forward along message from failed verification */
    throw new ApiError('CLIENT', { message })
  }
}

export { signToken, verifyJwt }
