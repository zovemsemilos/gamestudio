const http = require('http')
const path = require('path')
const express = require('express')
const mongodb = require('mongodb')
const socketio = require('socket.io')
const Manager = require('./manager')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// app.use((req, res, next) => {
//   if (req.header('x-forwarded-proto') !== 'https')
//     res.redirect(`https://${req.header('host')}${req.url}`)
//   else
//     next()
// })

app.use(express.static(path.join(__dirname, 'app')))
app.get('/', (req, res) => res.sendFile(`${__dirname}/app/index.html`))
app.get('*', (req, res) => res.sendFile(`${__dirname}/app/index.html`))

server.listen(process.env.PORT || 8080)

process.on('uncaughtException', (err, origin) => {
  console.error(`Error: ${err}\nOrigin: ${origin}`)
  process.exit(1)
})

const init = async () => {
  const url = process.env.MONGODB_URL
  const name = 'gamestudioDB'
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  try {
    const client = await mongodb.MongoClient.connect(url, options)
    const db = client.db(name)

    io.on('connection', socket => new Manager(io, socket, db).init())
  } catch (err) {
    console.error(err.message)
  }
}

init()