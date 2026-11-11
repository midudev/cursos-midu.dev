import OpenAI from "openai";

process.loadEnvFile()

const client = new OpenAI()

const ticket = process.argv[2] ?? "Hola, me habéis cobrado dos veces los 49 € del pedido #42351."

const decision = await client.decisions.create({
  model: 'gpt-6-luna',
  input: ticket,
  questions: [
    {
      type: "predicate",
      name: "should_refund",
      instructions: "Is a refund due? Yes: duplicate or unexplained charge. No: legitimate charge for an excessive or unexpected amount."
    }
  ]
})

console.log(decision)