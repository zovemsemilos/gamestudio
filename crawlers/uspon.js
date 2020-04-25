const fs = require('fs')
const crypto = require('crypto')
const puppeteer = require('puppeteer')

class UsponCrawler {
  constructor(manager, data) {
    this.browser
    this.page

    this.collection = data.collection
    this.products = []
    this.productsNew = []
    this.url = data.productsUrl
    this.socket = manager.socket
    this.imageSrcs = {}

    this.manager = manager
  }

  async login() {
    try {
      const {page, socket} = this

      await page.goto('https://uspon.rs/site/b2b')
      await page.waitFor(5000)
      await page.click(
        'a[class="btn btn-success js-terms-conditions-bottom-line-accept"]'
      )
      await page.waitFor(5000)
      await page.type('[name=email]', 'mszed2009@gmail.com')
      await page.type('[name=password]', 'game2019')
      await page.click('[type=submit]')
      await page.waitFor(10000)

      socket.emit('crawlUsponRes', '[ GS.AI ] Login successfull')
    } catch (err) {
      console.error(err)
    }
  }

  async getProductUrls() {
    try {
      const { page, url, socket } = this

      await page.goto(url)
      await page.waitFor(2000)

      const productUrls = await page.evaluate(() => {
        const qsa = (sel) => [...document.querySelectorAll(sel)]
        const ref = '.title a'
        const $a = qsa(ref)
        return $a.map(el => el.href)
      })

      socket.emit('crawlUsponRes', '[ GS.AI ] Product URLs collected successfully')
      return productUrls
    } catch (err) {
      console.error(err.message)
    }
  }

  async getProductData(url) {
    try {
      const { page, socket, collection } = this

      await page.goto(url)
      await page.waitFor(2000)

      const productData = await page.evaluate((collection) => {
        const qsa = sel => [...document.querySelectorAll(sel)]
        const qs = sel => document.querySelector(sel)
        const parseTable = input => {
          const parser = new DOMParser()
          const dom = parser.parseFromString(input, "text/html")
          const qs = (selector, parent = dom) => parent.querySelector(selector)
          const qsa = (selector, parent = dom) => [
            ...parent.querySelectorAll(selector)
          ]

          return qsa(".specification-row-holder").map((mainRow) => {
            const title = qs(".main-spec-title", mainRow).textContent + ":";
            const props = qsa(".specification-items", mainRow)
              .filter((specRow) => specRow.childElementCount > 0)
              .map((specRow) => {
                const [spec, value] = specRow.children;
                return spec.textContent + ": " + value.textContent;
              });

            return title + "\n" + props.join("\n")
          }).join("\n\n")
        }

        let heroImage = ''
        const $table = '.product-tab.specification .main-table:nth-child(2)'
        const table = parseTable(qs($table).outerHTML)
        const $images = '.owl-wrapper:first-child a.fancybox'
        const images = qsa($images).map(({href}) => href)
        const nameRef = 'h1.name'
        const name = qs(nameRef).innerText
        const priceRef = '.price-container .row:last-child span.value'
        const b2bPrice = parseInt(qs(priceRef).innerText.replace('.', ''))
        const price = (Math.ceil((b2bPrice * 1.44) / 100) * 100) - 10
        let rows = table.split('\n')
        let tableSpecs = []

        rows.forEach((row) => {
          const field = row.split(': ')
          const [left, right] = field
          tableSpecs.push({left, right})
        })

        return {
          name,
          collection,
          price,
          discount: 0,
          isInStock: true,
          info: {
            short: '',
            long: ''
          },
          tableFields: tableSpecs,
          media: {
            heroImage: images[0],
            youtubeUrl: '',
            galleryImages: images
          }
        }
      }, collection)

      if (productData.media.heroImage === 'https://uspon.rs/img/default/no-image-thumb.jpg') {
        productData.media.heroImage = 'assets/images/no-img.png'
      }

      socket.emit('crawlUsponRes', `[ GS.AI ] ${ productData.name } harvested successfully`)
      return productData
    } catch (err) {
      console.error(err.message)
    }
  }

  async downloadImages(cleanNew) {
    try {
      for (const item of cleanNew) {
        const { sku, name, images, imageSrcs } = item
        const { page, socket } = this
        const folderPath = `${ process.cwd() }/assets/images/products/${ sku }`
        const usponImg = 'https://uspon.rs/img/default/no-image-thumb.jpg'
        const gsImg = `${ process.cwd() }/assets/images/no-img.png`

        fs.mkdir(folderPath, err => {
          if (err) { console.error(err.message) }
        })

        if (imageSrcs[0] !== usponImg) {
          let i = 1

          while (i <= images) {
            const query = await page.goto(imageSrcs[i - 1])
            await page.waitFor(2000)
            const filePath = `${ folderPath }/${ i }.png`

            fs.writeFile(filePath, await query.buffer(), err => {
              if (err) { console.error(err.message) }
            })

            i += 1
          }
        } else {
          const query = await page.goto(gsImg)
          await page.waitFor(2000)
          const filePath = `${ folderPath }/1.png`

          fs.writeFile(filePath, await query.buffer(), err => {
            if (err) { console.error(err.message) }
          })
        }
        socket.emit('crawlUsponRes', `[ GS.AI ] ${ name } images downloaded successfully`)
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  async syncdb() {
    try {
      const { browser, manager, productsNew, collection } = this
      const dbCollection = collection.split(' ').join('_').toLowerCase()
      const {db, socket} = manager
      const hashCurrent = { }
      const hashNew = { }
      const items = await db.collection(dbCollection).find().toArray()

      // Create hashes from new and old products
      for (const item of productsNew) {
        if (item) {
          const { name } = item
          hashNew[name] = item
        }
      }
      for (const item of items) {
        const { name, sku } = item
        hashCurrent[name] = item
        // Remove items that don't exist on b2b
        if (!hashNew[name]) {
          const path = `${ process.cwd() }/assets/images/products/${ sku }`

          fs.rmdir(path, err => {
            if (err) {
              console.error(err.message)
            }
          })

          delete hashCurrent[name]
          socket.emit('crawlUsponRes', `[ GS.AI ] Product ${ name } removed. Out of stock`)
        }
        // Remove duplicates from new items
        if (hashNew[name]) {
          delete hashNew[name]
          socket.emit('crawlUsponRes', `[ GS.AI ] Product ${ name } removed. Duplicate`)
        }
      }

      const cleanCurrent = Object.keys(hashCurrent).map(key => hashCurrent[key])
      let cleanNew = Object.keys(hashNew).map(key => hashNew[key])

      //await this.downloadImages(cleanNew)

      //sorry xd
      cleanNew = Object.keys(hashNew).map(key => {
        delete hashNew[key].imageSrcs
        return hashNew[key]
      })

      this.products = [ ...cleanCurrent, ...cleanNew ]

      await db.collection(dbCollection).insertMany([...this.products])
      // for (const product of this.products) {
        
      // }

      //await collection.findOneAndReplace({ }, { items: this.products })
      await browser.close()

      socket.emit('crawlUsponRes', '[ GS.AI ] Syncing finished successfully')
    } catch (err) {
      console.error(err.message)
    }
  }

  async crawl() {
    try {
      const productUrls = await this.getProductUrls()
      const ignoreUrl = 'https://uspon.rs/b2b/productdetails'
      const filteredUrls = productUrls.filter(url => url !== ignoreUrl)

      for (const productUrl of filteredUrls) {
        const productData = await this.getProductData(productUrl)
        this.productsNew.push(productData)
      }

      await this.syncdb()
    } catch (err) {
      console.error(err.message)
    }
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({args: ['--no-sandbox']})
      this.page = await this.browser.newPage()

      await this.login()
      //await this.login() //retard webdevs cant make competent webapp lmao
      await this.crawl()
    } catch (err) {
      console.error(err.message)
    }
  }
}

module.exports = UsponCrawler