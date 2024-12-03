import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
console.log('Connecting to MongoDB with URI:', uri.replace(/:[^:]*@/, ':****@'))

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  ssl: process.env.NODE_ENV === 'production',
  tls: process.env.NODE_ENV === 'production',
  directConnection: true,
  retryReads: true
}

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    try {
      console.log('Creating new MongoDB client...')
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
        .then(client => {
          console.log('Successfully connected to MongoDB')
          return client.db().command({ ping: 1 })
            .then(() => {
              console.log('MongoDB ping successful')
              return client
            })
            .catch(err => {
              console.error('MongoDB ping failed:', err)
              throw err
            })
        })
        .catch(err => {
          console.error('MongoDB connection error:', {
            message: err.message,
            code: err.code,
            name: err.name,
            stack: err.stack
          })
          throw err
        })
    } catch (err) {
      console.error('Error creating MongoDB client:', err)
      throw err
    }
  } else {
    console.log('Using existing MongoDB client')
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  try {
    console.log('Creating new MongoDB client (production)')
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
      .then(client => {
        console.log('Successfully connected to MongoDB')
        return client.db().command({ ping: 1 })
          .then(() => {
            console.log('MongoDB ping successful')
            return client
          })
          .catch(err => {
            console.error('MongoDB ping failed:', err)
            throw err
          })
      })
      .catch(err => {
        console.error('MongoDB connection error:', {
          message: err.message,
          code: err.code,
          name: err.name,
          stack: err.stack
        })
        throw err
      })
  } catch (err) {
    console.error('Error creating MongoDB client:', err)
    throw err
  }
}

export default clientPromise
