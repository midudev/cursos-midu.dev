import { test, expect, mock, describe } from 'bun:test'
import { createStore } from './create-store.js'

describe('createStore', () => {
  test('should create a store with initial state', () => {
    const store = createStore(() => ({
      count: 0,
      name: 'test'
    }))

    expect(store.getState()).toEqual({
      count: 0,
      name: 'test'
    })
  })

  test('should return initial state with getInitialState', () => {
    const initialState = { count: 0, name: 'test' }
    const store = createStore(() => initialState)

    expect(store.getInitialState()).toEqual(initialState)
    expect(store.getState()).toEqual({ count: 0, name: 'test' })
  })

  test('should update state using setState with function', () => {
    const store = createStore(() => ({ count: 0 }))

    store.setState((state) => ({ count: state.count + 1 }))

    expect(store.getState().count).toBe(1)
  })

  test('should update state using setState with object', () => {
    const store = createStore(() => ({
      count: 0,
      name: 'test'
    }))

    store.setState({ count: 5 })

    expect(store.getState()).toEqual({
      count: 5,
      name: 'test'
    })
  })

  test('should trigger listeners when state changes', () => {
    const store = createStore(() => ({ count: 0 }))

    const listener = mock(() => {})
    store.subscribe(listener)

    store.setState({ count: 1 })

    expect(listener).toHaveBeenCalledWith(
      { count: 1 },
      { count: 0 }
    )
  })

  test('should not trigger listeners when state is identical (same reference)', () => {
    const store = createStore((set, get) => ({
      count: 0
    }))

    const listener = mock(() => {})
    store.subscribe(listener)

    const currentState = store.getState()
    // Set the exact same state reference
    store.setState(currentState)

    expect(listener).not.toHaveBeenCalled()
  })

  test('should return initial state even after updating the state once with getInitialState', () => {
    const initialState = { count: 0, name: 'test' }
    const store = createStore(() => initialState)

    store.setState({ count: 10 })

    expect(store.getInitialState()).toEqual(initialState)
    expect(store.getState()).toEqual({ count: 10, name: 'test' })
  })

  test('should replace state when nextState is not an object', () => {
    const store = createStore(() => ({
      count: 0,
      name: 'test'
    }))

    store.setState(42)

    expect(store.getState()).toBe(42)
  })

  test('should replace state when nextState is null', () => {
    const store = createStore(() => ({
      count: 0,
      name: 'test'
    }))

    store.setState(null)

    expect(store.getState()).toBe(null)
  })

  test('should trigger listeners even when state object is equivalent but not identical', () => {
    const store = createStore(() => ({
      count: 0
    }))

    const listener = mock(() => {})
    store.subscribe(listener)

    // Set the same state values but different object
    store.setState({ count: 0 })

    expect(listener).toHaveBeenCalledWith({ count: 0 }, { count: 0 })
  })

  test('should support multiple listeners', () => {
    const store = createStore(() => ({
      count: 0
    }))

    const listener1 = mock(() => {})
    const listener2 = mock(() => {})

    store.subscribe(listener1)
    store.subscribe(listener2)

    store.setState({ count: 1 })

    expect(listener1).toHaveBeenCalledWith({ count: 1 }, { count: 0 })
    expect(listener2).toHaveBeenCalledWith({ count: 1 }, { count: 0 })
  })

  test('should unsubscribe listener when calling returned function', () => {
    const store = createStore(() => ({
      count: 0
    }))

    const listener = mock(() => {})
    const unsubscribe = store.subscribe(listener)

    store.setState({ count: 1 })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.setState({ count: 2 })

    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('should provide correct api to createState function', () => {
    let receivedApi

    createStore((set, get, api) => {
      receivedApi = api
      return { count: 0 }
    })

    expect(receivedApi).toHaveProperty('setState')
    expect(receivedApi).toHaveProperty('getState')
    expect(receivedApi).toHaveProperty('getInitialState')
    expect(receivedApi).toHaveProperty('subscribe')

    expect(typeof receivedApi.setState).toBe('function')
    expect(typeof receivedApi.getState).toBe('function')
    expect(typeof receivedApi.getInitialState).toBe('function')
    expect(typeof receivedApi.subscribe).toBe('function')
  })

  test('should set initial state after createState function completes', () => {
    const store = createStore((set) => {
      set({ initialized: true })
      return { count: 0, initialized: false }
    })

    // The return value from createState becomes the initial state
    expect(store.getState().initialized).toBe(false)
    expect(store.getState().count).toBe(0)
  })

  test('should be able to get state inside a method of createStore', () => {
    const store = createStore((set, get) => ({
      count: 0,
      increment: () => set({ count: get().count + 1 })
    }))

    expect(store.getState().count).toBe(0)
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  test('should be able to get previous state when using set for updating the store', () => {
    const store = createStore((set, get) => ({
      count: 0,
      increment: () => set(prevState => ({
        count: prevState.count + 1
      }))
    }))

    expect(store.getState().count).toBe(0)
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  test('should handle nested object updates correctly', () => {
    const store = createStore(() => ({
      data: {
        users: [],
        posts: []
      },
      loading: false
    }))

    store.setState({
      data: {
        users: [{ id: 1, name: 'John' }],
        posts: []
      }
    })

    expect(store.getState().data.users).toHaveLength(1)
    expect(store.getState().loading).toBe(false)
  })

  test('should maintain listener order', () => {
    const store = createStore(() => ({ count: 0 }))
    const calls = []

    const listener1 = () => calls.push('listener1')
    const listener2 = () => calls.push('listener2')
    const listener3 = () => calls.push('listener3')

    store.subscribe(listener1)
    store.subscribe(listener2)
    store.subscribe(listener3)

    store.setState({ count: 1 })

    expect(calls).toEqual(['listener1', 'listener2', 'listener3'])
  })

  test('should handle empty state', () => {
    const store = createStore(() => ({}))

    expect(store.getState()).toEqual({})

    store.setState({ newProp: 'value' })
    expect(store.getState()).toEqual({ newProp: 'value' })
  })

  test('should handle primitive initial state', () => {
    const store = createStore(() => 'initial')

    expect(store.getState()).toBe('initial')

    store.setState('updated')
    expect(store.getState()).toBe('updated')
  })

  test('should prevent state mutation by using Object.assign', () => {
    const store = createStore(() => ({ items: [] }))
    const state1 = store.getState()

    store.setState({ items: [1, 2, 3] })
    const state2 = store.getState()

    expect(state1).not.toBe(state2)
    expect(state1.items).toEqual([])
    expect(state2.items).toEqual([1, 2, 3])
  })

  test('should work with array state', () => {
    const store = createStore(() => [1, 2, 3])

    expect(store.getState()).toEqual([1, 2, 3])

    store.setState([4, 5, 6])
    expect(store.getState()).toEqual([4, 5, 6])
  })
})
