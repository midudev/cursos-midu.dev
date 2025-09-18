// --- 01: Partial<T> ---
// Hace que todas las propiedades de un tipo sean opcionales.

console.log("--- 01: Partial<T> ---");

// Ejemplo 1: Actualizar un Perfil de Usuario
interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

function updateUser(id: number, fieldsToUpdate: Partial<User>) {
  console.log(`Actualizando usuario ${id} con:`, fieldsToUpdate);
  // Lógica para encontrar y actualizar el usuario en la BD...
}

updateUser(1, { email: "nuevo@correo.com" });  // ✅
updateUser(2, { name: "Ana", isAdmin: false }); // ✅
updateUser(3, { age: 18 }); // Error: 'age' no existe en 'User'

// Ejemplo 2: Filtros de Búsqueda Opcionales
interface ProductFilters {
  category: string;
  minPrice: number;
  maxPrice: number;
}

function findProducts(filters: Partial<ProductFilters>) {
  console.log("Buscando con los filtros:", filters);
  // Lógica para buscar productos aplicando solo los filtros presentes...
}

findProducts({ category: "electrónica" }); // ✅
findProducts({ minPrice: 100, maxPrice: 500 }); // ✅
findProducts({ color: "rojo" }); // Error: 'color' no existe en 'ProductFilters'