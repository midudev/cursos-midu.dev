export const createStore = (createState) => {
  let state
  const getState = () => state
  const listeners = new Set()

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const getInitialState = () => initialState
  const setState = (partial) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial

    const isSameState = Object.is(nextState, state)
    if (isSameState) return
    
    const hasToReplace = typeof nextState !== 'object' || nextState === null || Array.isArray(nextState)
    const previousState = state
    state = hasToReplace ? nextState : { ...state, ...nextState }

    listeners.forEach(
      (listener) => listener(state, previousState)
    )
  }

  const api = { getState, getInitialState, setState, subscribe }
  const initialState = state = createState(setState, getState, api)
  return api
}