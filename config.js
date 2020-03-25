const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gamestudio',
    dbName: process.env.MONGODB_DBNAME || 'gamestudio',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
}

module.exports = config