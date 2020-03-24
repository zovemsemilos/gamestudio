const puppeteer = require('puppeteer')
const crypto = require('crypto')
const fs = require('fs')

class BuygamesCrawler {
  constructor(collection, dbName, socket) {
    this.browser
    this.page
    this.url = 'https://www.buygames.ps/en/ps4-games'
    this.urls
    this.productsNew = [ ]
    this.productsOld

    this.collection = collection
    this.dbName = dbName
    this.socket = socket
  }

  async getProductUrls() {
    const { page } = this

    try {
      const urls = await page.evaluate(() => {
        const qsa = sel => [ ...document.querySelectorAll(sel) ]
        const sel = '.product_img_link'
        const elems = qsa(sel)

        return elems.map(elem => elem.href)
      })

      return urls
    } catch (err) {
      console.error(err.message)
    }
  }

  async getYoutubeUrl(name) {
    const { page } = this

    try {
      await page.goto('https://youtube.com', { waitUntil: 'networkidle2', timeout: 0 })
      await page.type('[id="search"]', name + ' trailer')
      await page.click('[id="search-icon-legacy"]')
      await page.waitFor(3000)

      const youtubeUrl = await page.evaluate(() => {
        const els = [ ...document.getElementsByTagName('ytd-video-renderer') ]
        return els[0].$['video-title'].href
      })

      return youtubeUrl.replace('https://www.youtube.com/watch?v=', '')
    } catch (err) {
      console.error(err.message)
    }
  }

  async getProductData() {
    const { page, urls } = this
    const sku = 'gs' + crypto.randomBytes(8).toString('hex')

    try {
      for (const url of urls) {
        await page.goto(url)
        await page.waitFor(3000)

        const data = await page.evaluate(sku => {
          const qs = sel => document.querySelector(sel)
          const elId = id => document.getElementById(id)

          const name = qs('h1[itemprop="name"]').innerText
          const priceOriginal = parseFloat(elId('our_price_display').innerText.replace(',', '.'))
          const price = (Math.ceil(((priceOriginal * 117) + 1650) / 100) * 100) - 10
          const discount = 0
          const isInStock = true
          const shortInfo = ''
          const longInfo = qs('.page-product-box .rte p').innerText
          const tableSpecs = { }
          const youtubeUrl = ''
          const images = 1
          const imageUrls = elId('bigpic').src
          const options = {
            platform: 'ps4',
            color: 'blue',
            awesome: 'fab fa-playstation'
          }

          return {
            sku,
            name,
            price,
            discount,
            isInStock,
            shortInfo,
            longInfo,
            tableSpecs,
            youtubeUrl,
            images,
            imageUrls,
            options
          }
        }, sku)

        data.youtubeUrl = await this.getYoutubeUrl(data.name)

        this.productsNew.push(data)
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  async downloadImages(cleanNew) {
    try {
      for (const item of cleanNew) {
        const { sku, name, images, imageUrls } = item
        const { page, socket } = this
        const folderPath = `${ process.cwd() }/assets/images/products/${ sku }`
        // const usponImg = 'https://uspon.rs/img/default/no-image-thumb.jpg'
        // const gsImg = `${ process.cwd() }/assets/images/no-img.png`

        fs.mkdir(folderPath, err => {
          if (err) { console.error(err.message) }
        })

        const query = await page.goto(imageUrls[0])
        await page.waitFor(3000)
        const filePath = `${ folderPath }/1.png`

        fs.writeFile(filePath, await query.buffer(), err => {
          if (err) { console.error(err.message) }
        })

        // if (imageUrls[0] !== usponImg) {
        //   let i = 1

        //   while (i <= images) {
        //     const query = await page.goto(imageUrls[i - 1])
        //     await page.waitFor(2000)
        //     const filePath = `${ folderPath }/${ i }.png`

        //     fs.writeFile(filePath, await query.buffer(), err => {
        //       if (err) { console.error(err.message) }
        //     })

        //     i += 1
        //   }
        // } else {
        //   const query = await page.goto(gsImg)
        //   await page.waitFor(2000)
        //   const filePath = `${ folderPath }/1.png`

        //   fs.writeFile(filePath, await query.buffer(), err => {
        //     if (err) { console.error(err.message) }
        //   })
        // }
        socket.emit('crawlBuygamesRes', `[ GS.AI ] ${ name } images downloaded successfully`)
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  async syncDB() {
    const { browser, productsNew, productsOld, collection } = this
    const hashNew = { }
    const hashOld = { }

    try {
      // Create hashes from new and old products
      for (const item of productsNew) {
        const { name } = item
        hashNew[name] = item
      }
      for (const item of productsOld) {
        const { name, sku } = item
        hashOld[name] = item
        // Remove items that don't exist on b2b
        if (!hashNew[name]) {
          const path = `${ process.cwd() }/assets/images/products/${ sku }`

          fs.rmdir(path, err => {
            if (err) {
              console.error(err.message)
            }
          })

          delete hashOld[name]
          socket.emit('crawlBuygamesRes', `[ GS.AI ] Product ${ name } removed. Out of stock`)
        }
        // Remove duplicates from new items
        if (hashNew[name]) {
          delete hashNew[name]
          socket.emit('crawlBuygamesRes', `[ GS.AI ] Product ${ name } removed. Duplicate`)
        }
      }

      const cleanOld = Object.keys(hashOld).map(key => hashOld[key])
      let cleanNew = Object.keys(hashNew).map(key => hashNew[key])

      await this.downloadImages(cleanNew)

      //sorry xd
      cleanNew = Object.keys(hashNew).map(key => {
        delete hashNew[key].imageUrls
        return hashNew[key]
      })

      this.products = [ ...cleanOld, ...cleanNew ]

      await collection.findOneAndReplace({ }, { items: this.products })
      await browser.close()
    } catch (err) {
      console.error(err.message)
    }
  }

  async showAllGames() {
    const { page, url, collection } = this

    try {
      await page.goto(url)
      await page.waitFor(3000)
      await page.evaluate(() => {
        const $showAll = document.querySelector('form.showall button')
        $showAll.click()
      })
      await page.waitFor(30000)

      const suckMyDickJavascript = await collection.findOne({ })
      this.productsOld = suckMyDickJavascript.items
      this.urls = await this.getProductUrls()
      await this.getProductData()

      await this.syncDB()
    } catch (err) {
      console.error(err.message)
    }
  }

  async launchBrowser() {
    try {
      this.browser = await puppeteer.launch({ headless: false })
      this.page = await this.browser.newPage()
    } catch (err) {
      console.error(err.message)
    }
  }

  async init() {
    try {
      await this.launchBrowser()
      await this.showAllGames()
    } catch (err) {
      console.error(err.message)
    }
  }
}

module.exports = BuygamesCrawler