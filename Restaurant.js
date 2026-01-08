
class DishNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "DishNotFoundError";
  }
}

class InvalidOrderError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidOrderError";
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class Dish {
  constructor(name, price, category = "general") {
    if (new.target === Dish) {
      throw new Error("Dish is an abstract class and cannot be instantiated directly.");
    }

    this._name = name;
    this._price = price;
    this.category = category;

    Object.defineProperty(this, "name", {
      get() {
        return this._name;
      },
      set(value) {
        if (!value || typeof value !== "string" || value.trim() === "") {
          throw new ValidationError("Dish name must be a non-empty string.");
        }
        this._name = value;
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(this, "price", {
      get() {
        return this._price;
      },
      set(value) {
        if (typeof value !== "number" || value <= 0) {
          throw new ValidationError("Price must be a positive number.");
        }
        this._price = value;
      },
      enumerable: true,
      configurable: true
    });
  }

  getInfo() {
    return {
      name: this.name,
      price: this.price,
      category: this.category
    };
  }
}

class Appetizer extends Dish {
  constructor(name, price) {
    super(name, price, "appetizer");
  }
}

class Entree extends Dish {
  constructor(name, price, prepTime = 15) {
    super(name, price, "entree");
    this.prepTime = prepTime;
  }

  getInfo() {
    return {
      ...super.getInfo(),
      prepTime: this.prepTime
    };
  }
}

class Dessert extends Dish {
  constructor(name, price) {
    if (price > 15) {
      throw new ValidationError("Dessert price cannot exceed $15.");
    }
    super(name, price, "dessert");
  }
}

class Menu {
  constructor(menuType) {
    if (new.target === Menu) {
      throw new Error("Menu is an abstract class and cannot be instantiated directly.");
    }
    this.menuType = menuType;
    this.#dishes = new Map();
  }

  #dishes;

  addDish(dish) {
    if (!(dish instanceof Dish)) {
      throw new InvalidOrderError("Item must be a Dish instance.");
    }
    this.#dishes.set(dish.name.toLowerCase(), dish);
  }

  removeDish(dishName) {
    const key = dishName.toLowerCase();
    if (!this.#dishes.has(key)) {
      throw new DishNotFoundError(`Dish "${dishName}" not found in ${this.menuType}.`);
    }
    this.#dishes.delete(key);
  }

  viewMenu() {
    return Array.from(this.#dishes.values()).map(dish => dish.getInfo());
  }

  getDish(dishName) {
    const key = dishName.toLowerCase();
    if (!this.#dishes.has(key)) {
      throw new DishNotFoundError(`Dish "${dishName}" not found in ${this.menuType}.`);
    }
    return this.#dishes.get(key);
  }

  hasDish(dishName) {
    return this.#dishes.has(dishName.toLowerCase());
  }

  increasePrice(dishName, percent) {
    const dish = this.getDish(dishName);
    const increase = dish.price * (percent / 100);
    dish.price = dish.price + increase;
  }

  decreasePrice(dishName, percent) {
    const dish = this.getDish(dishName);
    const decrease = dish.price * (percent / 100);
    const newPrice = dish.price - decrease;
    if (newPrice <= 0) {
      throw new ValidationError("Price cannot be zero or negative.");
    }
    dish.price = newPrice;
  }

  applyDemandPricing(popularDishNames, percentIncrease = 10) {
    popularDishNames.forEach(dishName => {
      try {
        this.increasePrice(dishName, percentIncrease);
      } catch (error) {
        console.warn(`Could not apply demand pricing to ${dishName}:`, error.message);
      }
    });
  }
}

class AppetizersMenu extends Menu {
  constructor() {
    super("AppetizersMenu");
  }
}

class EntreesMenu extends Menu {
  constructor() {
    super("EntreesMenu");
  }
}

class DessertsMenu extends Menu {
  constructor() {

super("DessertsMenu");
  }
}

class Order {
  constructor(customer) {
    this.customer = customer;
    this.#dishes = [];
    this.#dishQuantities = new Map();
    this.#createdAt = new Date().toISOString();
  }

  #dishes;
  #dishQuantities;
  #createdAt;

  addDish(dishName, menus, quantity = 1) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new InvalidOrderError("Quantity must be a positive integer.");
    }

    let dish = null;

    for (const menu of menus) {
      if (menu.hasDish(dishName)) {
        dish = menu.getDish(dishName);
        break;
      }
    }

    if (!dish) {
      throw new DishNotFoundError(`Dish "${dishName}" not found in any menu.`);
    }

    const dishKey = dishName.toLowerCase();
    if (this.#dishQuantities.has(dishKey)) {
      this.#dishQuantities.set(dishKey, this.#dishQuantities.get(dishKey) + quantity);
    } else {
      this.#dishes.push(dish);
      this.#dishQuantities.set(dishKey, quantity);
    }
  }

  placeOrder(restaurant = null) {
    this.customer.placeOrder(this);
    if (restaurant && Array.isArray(restaurant.orders)) {
      restaurant.orders.push(this);
    }
  }

  getTotal() {
    let total = 0;
    this.#dishes.forEach(dish => {
      const quantity = this.#dishQuantities.get(dish.name.toLowerCase());
      total += dish.price * quantity;
    });
    return parseFloat(total.toFixed(2));
  }

  viewSummary() {
    const items = this.#dishes.map(dish => ({
      name: dish.name,
      price: dish.price,
      quantity: this.#dishQuantities.get(dish.name.toLowerCase()),
      subtotal: dish.price * this.#dishQuantities.get(dish.name.toLowerCase())
    }));

    return {
      customer: this.customer.name,
      items: items,
      total: this.getTotal(),
      createdAt: this.#createdAt
    };
  }

  getCreatedAt() {
    return this.#createdAt;
  }
}

class Customer {
  constructor(name, contactInfo) {
    this.orderHistory = [];

    Object.defineProperty(this, "name", {
      get() {
        return this._name;
      },
      set(value) {
        if (!value || typeof value !== "string" || value.trim() === "") {
          throw new ValidationError("Name must be a non-empty string.");
        }
        this._name = value;
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(this, "contactInfo", {
      get() {
        return this._contactInfo;
      },
      set(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          throw new ValidationError(
            "Contact info must be a valid email or 10-digit phone number."
          );
        }
        this._contactInfo = value;
      },
      enumerable: true,
      configurable: true
    });

    this.name = name;
    this.contactInfo = contactInfo;
  }

  placeOrder(order) {
    if (!(order instanceof Order)) {
      throw new InvalidOrderError("Must be a valid Order instance.");
    }
    this.orderHistory.push(order);
  }

  viewOrderHistory() {
    return this.orderHistory.map(order => order.viewSummary());
  }

  isLoyalCustomer(threshold = 3) {
    return this.orderHistory.length >= threshold;
  }
}

function withLogging(originalMethod, methodName, restaurant = null) {
  return function (...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] Operation: ${methodName} | Customer: ${
      this.customer ? this.customer.name : "N/A"
    } | Total: $${this.getTotal ? this.getTotal() : "N/A"}\n`;

    console.log(logMessage);

    if (!globalThis.restaurantLogs) {
      globalThis.restaurantLogs = [];
    }
    globalThis.restaurantLogs.push(logMessage);

    return originalMethod.apply(this, args);
  };
}

function withDiscount(originalMethod, restaurant) {
  return function (order) {
    let discountPercent = 0;

    if (order.getTotal() > 50) {
      discountPercent = 10;
    } else if (order.getTotal() > 30) {
      discountPercent = 5;
    }

    if (order.customer.isLoyalCustomer(3)) {
      discountPercent += 5;
    }


    if (discountPercent > 0) {
      const originalTotal = order.getTotal();
      const discountAmount = originalTotal * (discountPercent / 100);
      console.log(`Loyalty/Bulk Discount Applied: -$${discountAmount.toFixed(2)} (${discountPercent}%)`);
    }

    return originalMethod.apply(this, arguments);
  };
}

class Restaurant {
  constructor(name) {
    this.name = name;
    this.appetizerMenu = new AppetizersMenu();
    this.entreeMenu = new EntreesMenu();
    this.dessertMenu = new DessertsMenu();
    this.orders = [];
  }

  addDishToMenu(dish, menuType) {
    if (menuType === "appetizer") {
      this.appetizerMenu.addDish(dish);
    } else if (menuType === "entree") {
      this.entreeMenu.addDish(dish);
    } else if (menuType === "dessert") {
      this.dessertMenu.addDish(dish);
    }
  }

  createOrder(customer) {
    const order = new Order(customer);
    return order;
  }

  placeOrder(order) {
    order.placeOrder(this);
    const summary = order.viewSummary();
    console.log(`\nOrder placed for ${summary.customer}:`);
    console.log(`  Items: ${summary.items.map(item => `${item.name} x${item.quantity}`).join(", ")}`);
    console.log(`  Total: $${summary.total}\n`);
  }

  getAllMenus() {
    return {
      appetizers: this.appetizerMenu.viewMenu(),
      entrees: this.entreeMenu.viewMenu(),
      desserts: this.dessertMenu.viewMenu()
    };
  }

  viewAllOrders() {
    return this.orders.map(order => order.viewSummary());
  }

  getOrdersByCustomer(customerName) {
    return this.orders
      .filter(order => order.customer.name.toLowerCase() === customerName.toLowerCase())
      .map(order => order.viewSummary());
  }
}

Order.prototype.placeOrder = withLogging(Order.prototype.placeOrder, "placeOrder");

try {
  const myRestaurant = new Restaurant("Gourmet Palace");

  const app1 = new Appetizer("Bruschetta", 8.99);
  const app2 = new Appetizer("Spring Rolls", 7.50);
  const ent1 = new Entree("Grilled Salmon", 24.99, 20);
  const ent2 = new Entree("Ribeye Steak", 29.99, 25);
  const des1 = new Dessert("Chocolate Cake", 9.99);
  const des2 = new Dessert("Tiramisu", 10.50);

  myRestaurant.addDishToMenu(app1, "appetizer");
  myRestaurant.addDishToMenu(app2, "appetizer");
  myRestaurant.addDishToMenu(ent1, "entree");
  myRestaurant.addDishToMenu(ent2, "entree");
  myRestaurant.addDishToMenu(des1, "dessert");
  myRestaurant.addDishToMenu(des2, "dessert");

  console.log("=== Restaurant Menus ===\n");
  const allMenus = myRestaurant.getAllMenus();
  console.log("Appetizers:", allMenus.appetizers);
  console.log("Entrees:", allMenus.entrees);
  console.log("Desserts:", allMenus.desserts);

  const customer1 = new Customer("John Doe", "john@example.com");
  const customer2 = new Customer("Jane Smith", "5551234567");

  const order1 = myRestaurant.createOrder(customer1);
  order1.addDish("Bruschetta", [myRestaurant.appetizerMenu]);
  order1.addDish("Grilled Salmon", [myRestaurant.entreeMenu]);
  order1.addDish("Chocolate Cake", [myRestaurant.dessertMenu]);

  console.log("=== Order 1 Summary ===");
  console.log(order1.viewSummary());

  myRestaurant.placeOrder(order1);

  const order2 = myRestaurant.createOrder(customer2);
  order2.addDish("Spring Rolls", [myRestaurant.appetizerMenu], 2);
  order2.addDish("Ribeye Steak", [myRestaurant.entreeMenu]);
  order2.addDish("Tiramisu", [myRestaurant.dessertMenu], 2);

  console.log("=== Order 2 Summary ===");
  console.log(order2.viewSummary());

  myRestaurant.placeOrder(order2);

  console.log("=== Dynamic Pricing ===");
  console.log("Before: Grilled Salmon price:", myRestaurant.entreeMenu.getDish("Grilled Salmon").price);
  myRestaurant.entreeMenu.increasePrice("Grilled Salmon", 15);
  console.log("After 15% increase:", myRestaurant.entreeMenu.getDish("Grilled Salmon").price);

  myRestaurant.dessertMenu.decreasePrice("Tiramisu", 10);
  console.log("After 10% decrease on Tiramisu:", myRestaurant.dessertMenu.getDish("Tiramisu").price);
} catch (error) {
  console.error(error);
}
