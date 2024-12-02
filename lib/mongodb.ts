import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {
  maxPoolSize: 1,
  minPoolSize: 1,
  retryWrites: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  ssl: true,
  tls: true,
  replicaSet: 'atlas-9k2fcu-shard-0',
  authMechanism: 'DEFAULT',
  directConnection: false,
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
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
        .then(client => {
          console.log('Successfully connected to MongoDB Atlas')
          return client
        })
        .catch(err => {
          console.error('MongoDB connection error:', {
            message: err.message,
            code: err.code,
            name: err.name
          })
          throw err
        })
    } catch (err) {
      console.error('Error creating MongoDB client:', err)
      throw err
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  try {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
      .then(client => {
        console.log('Successfully connected to MongoDB Atlas')
        return client
      })
      .catch(err => {
        console.error('MongoDB connection error:', {
          message: err.message,
          code: err.code,
          name: err.name
        })
        throw err
      })
  } catch (err) {
    console.error('Error creating MongoDB client:', err)
    throw err
  }
}

export default clientPromise
