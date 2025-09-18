// =======================================================
//      CURSO DE UTILITY TYPES DE TYPESCRIPT - EJEMPLOS
// =======================================================


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

updateUser(1, { email: "nuevo@correo.com" });
updateUser(2, { name: "Ana", isAdmin: false });

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

findProducts({ category: "electrónica" });
findProducts({ minPrice: 100, maxPrice: 500 });


// --- 02: Required<T> ---
// Hace que todas las propiedades de un tipo (incluso las opcionales) sean requeridas.

console.log("\n--- 02: Required<T> ---");

// Ejemplo 1: Configuración de una Aplicación
interface AppConfig {
  port?: number;
  databaseUrl?: string;
  environment: "development" | "production";
}

function finalizeConfig(config: AppConfig): Required<AppConfig> {
  return {
    port: config.port ?? 3000,
    databaseUrl: config.databaseUrl ?? "mongodb://localhost/db",
    environment: config.environment,
  };
}

const finalConfig = finalizeConfig({ environment: "production" });
console.log("Configuración final:", finalConfig);


// --- 03: Omit<T, K> ---
// Crea un tipo eliminando las propiedades K del tipo T.

console.log("\n--- 03: Omit<T, K> ---");

// Ejemplo 1: Eliminar Datos Sensibles
interface UserWithPassword {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
}

type PublicUser = Omit<UserWithPassword, "passwordHash">;

const publicProfile: PublicUser = {
  id: 1,
  name: "Carlos",
  email: "carlos@correo.com",
};
console.log("Perfil público del usuario:", publicProfile);

// Ejemplo 2: DTO para Crear un Recurso
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

type CreatePostDTO = Omit<Post, "id" | "createdAt">;

function createNewPost(data: CreatePostDTO) {
  const newPost: Post = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };
  console.log("Creando nuevo post:", newPost);
}

createNewPost({ title: "Mi primer Post", content: "¡Hola Mundo!" });


// --- 04: Pick<T, K> ---
// Crea un tipo seleccionando solo las propiedades K del tipo T.

console.log("\n--- 04: Pick<T, K> ---");

// Ejemplo 1: Crear una Tarjeta de Vista Previa
interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  views: number;
  tags: string[];
}

type PostPreview = Pick<BlogPost, "title" | "author" | "tags">;

const previewData: PostPreview = {
  title: "Aprende Utility Types",
  author: "Gemini",
  tags: ["typescript", "desarrollo-web"],
};
console.log("Vista previa del post:", previewData);


// --- 05: ReadOnly<T> ---
// Hace que todas las propiedades de un tipo sean de solo lectura.

console.log("\n--- 05: ReadOnly<T> ---");

// Ejemplo 1: Constantes de configuración
interface AppSettings {
  readonly apiUrl: string;
  theme: "light" | "dark";
}

const settings: Readonly<AppSettings> = {
  apiUrl: "/api/v1",
  theme: "dark",
};

// settings.apiUrl = "/api/v2"; // Error: Cannot assign to 'apiUrl' because it is a read-only property.
console.log("Configuración de la app:", settings);


// --- 06: Exclude<T, U> ---
// Crea un tipo excluyendo de T los tipos que son asignables a U. Útil con uniones.

console.log("\n--- 06: Exclude<T, U> ---");

// Ejemplo 1: Estados de una Petición
type RequestStatus = "loading" | "success" | "error";
type FinalStatus = Exclude<RequestStatus, "loading">;

const status: FinalStatus = "success";
// const anotherStatus: FinalStatus = "loading"; // Error: Type '"loading"' is not assignable to type 'FinalStatus'.
console.log("Estado final de la petición:", status);


// --- 07: Extract<T, U> ---
// Crea un tipo extrayendo de T los tipos que son asignables a U. Es lo opuesto a Exclude.

console.log("\n--- 07: Extract<T, U> ---");

// Ejemplo 1: Filtrar eventos
type AppEvent = "click" | "hover" | "submit" | "keydown";
type MouseEvent = Extract<AppEvent, "click" | "hover">;

const mouseAction: MouseEvent = "click";
console.log("Evento del ratón:", mouseAction);


// --- 08: ReturnType<T> ---
// Obtiene el tipo de retorno de una función.

console.log("\n--- 08: ReturnType<T> ---");

function createAuthResponse(success: boolean) {
  if (success) {
    return { status: 200, token: "abc-123" };
  }
  return { status: 401, error: "Unauthorized" };
}

type AuthResponse = ReturnType<typeof createAuthResponse>;

const successResponse: AuthResponse = { status: 200, token: "xyz-456" };
console.log("Respuesta de autenticación:", successResponse);


// --- 09: Parameters<T> ---
// Obtiene los tipos de los parámetros de una función como una tupla.

console.log("\n--- 09: Parameters<T> ---");

function sendMessage(chatId: string, message: string, attachment?: File) {
  // Lógica para enviar mensaje...
}

type MessageParams = Parameters<typeof sendMessage>;

const file = new File(["contenido"], "archivo.txt", { type: "text/plain" });
const messageArgs: MessageParams = ["#general", "Hola equipo!", file];
console.log("Argumentos de la función sendMessage:", messageArgs);


// --- 10: NonNullable<T> ---
// Crea un tipo excluyendo null y undefined de T.

console.log("\n--- 10: NonNullable<T> ---");

type MaybeString = string | null | undefined;

function processText(text: NonNullable<MaybeString>) {
  console.log(text.trim());
}

let textInput: MaybeString = "  Hola Mundo  ";
if (textInput) {
  processText(textInput); // Dentro del if, TypeScript sabe que no es null/undefined
}


// --- 11: Awaited<T> ---
// Desenvuelve el tipo de una Promesa, obteniendo el tipo que resuelve.

console.log("\n--- 11: Awaited<T> ---");

async function fetchUserData(id: number): Promise<User> {
  // Simula una llamada a una API
  return { id, name: "Elena", email: "elena@correo.com", isAdmin: true };
}

type FetchedUser = Awaited<ReturnType<typeof fetchUserData>>;

async function displayUser() {
  const user: FetchedUser = await fetchUserData(10);
  console.log(`Usuario obtenido con Awaited: ${user.name}`);
}

displayUser();