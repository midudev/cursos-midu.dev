// --- 10: NonNullable<T> ---
// Crea un tipo excluyendo null y undefined de T.

type UserEmail = `${string}@${string}.${string}` | null | undefined

interface User {
  id: number
  email: UserEmail
}

const users: User[] = [
  { id: 1, email: "midu@dev.com" },
  { id: 2, email: null },
  { id: 3, email: undefined },
  { id: 4, email: "team@midu.dev" }
]

function sendNewsletter(email: NonNullable<UserEmail>) {
  console.log(`✉️ Enviando newsletter a: ${email}`)
}

users.forEach(user => {
  if (user.email) {
    sendNewsletter(user.email)
  }
})