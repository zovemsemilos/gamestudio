const getSearchData = async (manager) => {
  const {socket, db} = manager

  try {
    const menus = await manager.getProductCollections()
    const searchData = []

    function titleCase(str) {
      const splitStr = str.split('_')

      for (let i = 0; i < splitStr.length; i += 1) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)
      }

      return splitStr.join(' ')
    }

    for (const menu in menus) {
      for (const category in menus[menu]) {
        for (const collection of menus[menu][category]) {
          const products = await db.collection(collection).find().toArray()
          const newProducts = []

          for (const product of products) {
            const {_id, name, media: {heroImage}} = product

            newProducts.push({collection, _id, name, media: {heroImage}})
          }

          searchData.push({
            label: `${category} / ${titleCase(collection)}`,
            products: newProducts
          })
        }
      }
    }

    socket.emit('getSearchDataRes', searchData)
  } catch (err) {
    console.error(err)
  }
}

module.exports = getSearchData