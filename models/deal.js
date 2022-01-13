class Deal {
    constructor(id, category, itemName,images, description, isAvailable, price,drinkcount, garliccount,pastacount,pizzacount ) {
            this.id = id;
            this.category = category;
            this.itemName = itemName;            
            this.images = images;        
            this.description = description;            
            this.isAvailable = isAvailable;            
            this.price = price;
            this.drinkcount = drinkcount;
            this.garliccount = garliccount;
            this.pastacount = pastacount;
            this.pizzacount = pizzacount;
    }
}

module.exports = Deal;