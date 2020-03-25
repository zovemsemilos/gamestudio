const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongodb = require('mongodb')

const eventImports = {
  // Header
  getSearchData: require('./events/header/get-search-data'),
  login: require('./events/header/login'),
  register: require('./events/header/register'),
  search: require('./events/header/search'),
  // Menu
  addMenu: require('./events/menu/add-menu'),
  editMenu: require('./events/menu/edit-menu'),
  getMenus: require('./events/menu/get-menus'),
  removeMenu: require('./events/menu/remove-menu'),
  // Views / Products
  addProduct: require('./events/views/products/add-product'),
  addToCart: require('./events/views/products/add-to-cart'),
  editProduct: require('./events/views/products/edit-product'),
  getProducts: require('./events/views/products/get-products'),
  removeProduct: require('./events/views/products/remove-product'), 
  syncProducts: require('./events/views/products/sync-products'),
  // Views / Cart
  decreaseQty: require('./events/views/cart/decrease-qty'),
  getCart: require('./events/views/cart/get-cart'),
  increaseQty: require('./events/views/cart/increase-qty'),
  removeFromCart: require('./events/views/cart/remove-from-cart'),
  // Views / Home
  getBanners: require('./events/views/home/get-banners'),
  editBanners: require('./events/views/home/edit-banners'),
  getDiscountedProducts: require('./events/views/home/get-discounted-products'),
  // To Do...
  authenticate: require('./events/authenticate'),
  checkoutApproved: require('./events/checkout-approved'),
  getProduct: require('./events/get-product'),
}

class Manager {
  constructor(io, socket, db) {
    this.io = io
    this.socket = socket
    this.db = db

    this.jwtSecret = 'gsgs'
    this.saltRounds = 12
  }

  init() {
    const events = Object.keys(eventImports).reduce((acc, cur) => {
      acc[cur] = (data) => eventImports[cur](this, data ? data : {})
      return acc
    }, {})

    Object.keys(events).forEach((event) => this.socket.on(event, events[event]))
  }

  getMongoId(string) {
    return mongodb.ObjectId(string)
  }

  get bcrypt() {return bcrypt}
  get jwt() {return jwt}
  get mongodb() {return mongodb}

  async hashPassword(password) {
    const {saltRounds} = this

    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      return hashedPassword
    } catch (err) {
      console.error(err)
    }
  }

  async verifyPassword(first, second) {
    try {
      const verified = await bcrypt.compare(first, second)
      return verified
    } catch (err) {
      console.error(err)
    }
  }

  signToken(id, options) {
    const {jwtSecret} = this

    try {
      const token = jwt.sign({id}, jwtSecret, options)
      return token
    } catch (err) {
      console.error(err)
    }
  }

  async verifyToken(token) {
    const {socket, db, jwtSecret} = this

    try {
      const {id} = jwt.verify(token, jwtSecret)
      const _id = this.getMongoId(id)
      const account = await db.collection('accounts').findOne({_id})
      return account
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        socket.emit('matDialogClose')
        socket.emit('expiredToken')
      } else if (err.name === 'JsonWebTokenError') {
        socket.emit('matDialogClose')
        socket.emit('invalidToken')
      } else {
        console.error(err)
      }
    }
  }

  async verifyAdmin(token) {
    const {socket} = this

    try {
      const {role} = await this.verifyToken(token)

      if (role === 'admin') {
        return true
      } else {
        socket.emit('accessRestricted')
        return false
      }
    } catch (err) {
      console.error(err)
    }
  }

  async getProductCollections() {
    const {db} = this

    try {
      const menus = await db.collection('menus').find().toArray()
      const collections = []

      menus.forEach((menu) => {
        menu.categories.forEach((category) => {
          category.collections.forEach((collection) => {
            collections.push(collection.name.split(' ').join('_').toLowerCase())
          })
        })
      })

      return collections
    } catch (err) {
      console.error(err)
    }
  }

  // async getProductCollections() {
  //   const {db} = this

  //   try {
  //     const menus = await db.collection('menus').find().toArray()
  //     const newColl = {}

  //     for (const menu of menus) {
  //       newColl[menu.name] = {}

  //       for (const category of menu.categories) {
  //         newColl[menu.name][category.name] = []

  //         for (const collection of category.collections) {
  //           newColl[menu.name][category.name].push(collection.name.split(' ').join('_').toLowerCase())
  //         }
  //       }
  //     }

  //     return newColl
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }
}

module.exports = Manager