// --- 03: Omit<T, K> ---
// Crea un tipo eliminando las propiedades K del tipo T.

interface Avenger {
  name: string
  power: number
  weapon?: string
  alive: boolean
}

type AvengerWithoutSpoilers = Omit<Avenger, 'alive'>

const ironMan: AvengerWithoutSpoilers = {
  name: 'Iron Man',
  power: 9000,
  weapon: 'Un millionario con armadura'
}

type AvengerBasicInfo = Omit<Avenger, 'weapon' | 'alive'>

const ironManBasic: AvengerBasicInfo = {
  name: 'Iron Man',
  power: 9000
}

const ironManBasicError: AvengerBasicInfo = {
  name: 'Iron Man',
  power: 9000,
  weapon: 'Un millionario con armadura' // Error: La propiedad 'weapon' no existe en el tipo 'AvengerBasicInfo'
}