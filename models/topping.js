class Topping {
    constructor(id, category, toppingName, available, price ) {
            this.id = id;
            this.category = category;
            this.toppingName = toppingName;                  
            this.available = available;            
            this.price = price;
    }
}

module.exports = Topping;