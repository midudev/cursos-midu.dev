import { create } from './global-state-manager/react-solucion.js'

export const useCounterStore = create(set => ({
  counter: 0,
  
  increment: () =>
    set((state) => ({ counter: state.counter + 1 })),
  
  decrement: () =>
    set((state) => ({ counter: state.counter - 1 })),
  
  reset: () =>
    set({ counter: 0 }),

  incrementBy: (value) =>
    set((state) => ({ counter: state.counter + value }))
}))
