const UsponCrawler = require('../../../crawlers/uspon')

const syncProducts = async (manager, data) => {
  try {
    return new UsponCrawler(manager, data.productsUrl).init()
  } catch (err) {
    console.error(err)
  }
}

module.exports = syncProducts