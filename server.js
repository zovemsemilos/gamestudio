const http = require('http')
const path = require('path')
const express = require('express')
const mongodb = require('mongodb')
const socketio = require('socket.io')
const config = require('./config')
const Manager = require('./manager')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, 'app')))
app.get('/', (req, res) => res.sendFile(`${__dirname}/app/index.html`))
app.get('*', (req, res) => res.sendFile(`${__dirname}/app/index.html`))

process.on('uncaughtException', (err, origin) => {
  console.error(`Error: ${err}\nOrigin: ${origin}`)
  process.exit(1)
})

server.listen(process.env.PORT || 8081)

const init = async () => {
  try {
    const {uri, dbName, options} = config.mongodb
    const client = await mongodb.MongoClient.connect(uri, options)
    const db = client.db(dbName)

    io.on('connection', (socket) => new Manager(io, socket, db).init())
  } catch (err) {
    console.error(err)
  }
}

init()