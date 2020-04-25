const UsponCrawler = require('../../../crawlers/uspon')

const syncProducts = async (manager, data) => {
  try {
    return new UsponCrawler(manager, data).init()
  } catch (err) {
    console.error(err)
  }
}

module.exports = syncProducts