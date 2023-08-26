const Menu = require('../models/menuModel') // مسیر صحیح را جایگزین کنید

const getEditMenuPage = (req, res) => {
    res.render('editMenu') // Render the 'editMenu.ejs' template
}


const addMenuItem = async (req, res) => {
    const { itemName, category, price } = req.body
    // console.log( itemName, category, price )

    try {
        const newMenuItem = new Menu({
            itemName: itemName,
            category: category,
            price: price
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
    getEditMenuPage, addMenuItem
}