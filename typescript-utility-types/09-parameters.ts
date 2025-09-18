// --- 09: Parameters<T> ---
// Obtiene los tipos de los parámetros de una función como una tupla.

function sendMessage(chatId: string, message: string, attachment?: File) {
  // Lógica para enviar mensaje...
}

type SendMessageParams = Parameters<typeof sendMessage>;

const sendMessageParams: SendMessageParams = [
  "#general",
  "Hola a todos"
]

sendMessage(...sendMessageParams)

