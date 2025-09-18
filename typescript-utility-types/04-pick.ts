// --- 04: Pick<T, K> ---
// Crea un tipo seleccionando solo las propiedades K del tipo T.

interface Movie {
  title: string
  director: string
  year: number
  genre: string
  rating: number
}

type MovieBasicInfo = Pick<Movie, 'title' | 'director'>

const movieBasicInfo: MovieBasicInfo = { title: 'Inception', director: 'Christopher Nolan' }

type MovieRating = Pick<Movie, 'rating'>

const movieRating: MovieRating = { rating: 8 }

const rating: Movie["rating"] = 8