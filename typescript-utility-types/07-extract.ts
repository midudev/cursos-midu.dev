// --- 07: Extract<T, U> ---
// Crea un tipo extrayendo de T los tipos que son asignables a U. Es lo opuesto a Exclude.

type Pokemon =
  | { kind: "pikachu"; thunderLevel: number }
  | { kind: "bulbasaur"; venomLevel: number }
  | { kind: "magikarp"; waterLevel: number }
  | { kind: "charmander"; fireLevel: number }
  | { kind: "squirtle"; waterLevel: number }
  | { kind: "psyduck"; waterLevel: number }
  | { kind: "vaporeon"; waterLevel: number }

type WaterPokemon = Extract<Pokemon, { waterLevel: number }>

const waterPokemon: WaterPokemon = { kind: "squirtle", waterLevel: 100 }
