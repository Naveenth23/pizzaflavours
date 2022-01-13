class Item {
    constructor(id, category, itemName,ingredients,toppings, images, description, isAvailable, price,toppingLimits ) {
            this.id = id;
            this.category = category;
            this.itemName = itemName;        
            this.ingredients = ingredients;        
            this.toppings = toppings;        
            this.images = images;        
            this.description = description;            
            this.isAvailable = isAvailable;            
            this.price = price;
            this.toppingLimits = toppingLimits;
    }
}

module.exports = Item;