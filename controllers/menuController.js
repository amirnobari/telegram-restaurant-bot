const Menu = require('../models/menuModel')

const getEditMenuPage = (req, res) => {
    res.render('editMenu')
}

const addMenuItem = async (req, res) => {
    const { itemName, category, price } = req.body

    try {
        const newMenuItem = new Menu({
            itemName: req.body.itemName,
            category: req.body.category,
            price: req.body.price
        })

        const savedMenuItem = await newMenuItem.save()
        console.log('New menu item added:', savedMenuItem)

        res.redirect('/menus/edit') // Redirect back to the edit menu page
    } catch (error) {
        console.error('Error adding new menu item:', error)
        res.status(500).send('An error occurred while adding the new menu item.')
    }
}

module.exports = {
    getEditMenuPage,
    addMenuItem
}
