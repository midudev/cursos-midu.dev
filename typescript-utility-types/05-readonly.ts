// --- 05: Readonly<T> ---
// Hace que todas las propiedades de un tipo sean de solo lectura.

interface Pizza {
  name: string;
  toppings: Readonly<string[]>;
}

const pizza: Readonly<Pizza> = {
  name: 'Margherita',
  toppings: ['Tomato', 'Mozzarella', 'Basil']
}

// no se pueden modificar las propiedades
pizza.name = 'Pepperoni'; // Error
pizza.toppings.push('Pepperoni'); // Error

