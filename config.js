const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DBNAME,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
}

module.exports = config