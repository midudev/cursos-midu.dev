import { useSyncExternalStore } from 'react'
import { createStore } from './create-store'

const defaultSelector = (arg) => arg

export const create = (createState) => {
  const store = createStore(createState)
  
  const useStore = (selector = defaultSelector) => {
    return useSyncExternalStore(
      store.subscribe,
      () => selector(store.getState()),
      () => selector(store.getInitialState())
    )
  }

  Object.assign(useStore, store)
  return useStore
}