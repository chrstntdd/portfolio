export type GraphQlErrorType = 'CLIENT' | 'SERVER'

export class ApiError extends Error {
  constructor(type: GraphQlErrorType, errors) {
    super(errors)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.extensions = {
      date: new Date(),
      type,
      ...errors
    }
  }
  extensions: any
}
