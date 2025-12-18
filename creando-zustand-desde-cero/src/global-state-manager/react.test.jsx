import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

import { create } from './react-solucion.js'

// Clean DOM after each test
afterEach(cleanup)

// Test component for useStore hook
const TestComponent = ({ useStore, selector }) => {
  const state = useStore(selector)

  return (
    <div>
      <div data-testid='state-value'>{JSON.stringify(state)}</div>
      <button
        data-testid='increment-count'
        onClick={() => {
          useStore.setState(state => ({ count: state.count + 1 }))
        }}
      >
        Increment
      </button>
      <button
        data-testid='set-name'
        onClick={() => {
          useStore.setState({ name: 'updated' })
        }}
      >
        Set Name
      </button>
    </div>
  )
}

// Test component for create hook
const TestCreateComponent = ({ useAppStore }) => {
  const { count, name } = useAppStore()
  const setState = useAppStore.setState

  return (
    <div>
      <div data-testid='count'>{count}</div>
      <div data-testid='name'>{name}</div>
      <button
        data-testid='increment'
        onClick={() => setState({ count: count + 1 })}
      >
        Increment
      </button>
      <button
        data-testid='update-name'
        onClick={() => setState({ name: 'Updated Name' })}
      >
        Update Name
      </button>
    </div>
  )
}

// Test component with selector
const TestSelectorComponent = ({ useAppStore }) => {
  const count = useAppStore(state => state.count)
  const name = useAppStore(state => state.name)

  return (
    <div>
      <div data-testid='count-only'>{count}</div>
      <div data-testid='name-only'>{name}</div>
      <button
        data-testid='increment-selector'
        onClick={() => useAppStore.setState(state => ({ count: state.count + 1 }))}
      >
        Increment
      </button>
    </div>
  )
}

describe('useStore', () => {
  test('useStore should return initial state', () => {
    const store = create(() => ({ count: 0, name: 'test' }))

    render(<TestComponent useStore={store} />)

    expect(screen.getByTestId('state-value')).toHaveTextContent('{"count":0,"name":"test"}')
  })

  test('useStore should update when state changes', () => {
    const store = create(() => ({ count: 0, name: 'test' }))

    render(<TestComponent useStore={store} />)

    const incrementButton = screen.getByTestId('increment-count')

    act(() => {
      fireEvent.click(incrementButton)
    })

    expect(screen.getByTestId('state-value')).toHaveTextContent('{"count":1,"name":"test"}')
  })

  test('useStore should work with selector', () => {
    const store = create(() => ({ count: 5, name: 'test' }))
    const selector = (state) => state.count

    render(<TestComponent useStore={store} selector={selector} />)

    expect(screen.getByTestId('state-value')).toHaveTextContent('5')
  })

  test('useStore should only re-render when selected value changes', () => {
    const useStore = create(
      (set) => ({
        count: 0,
        name: 'test',
        increment: (state) => set({ count: state.count + 1 }) }
      ))
    const renderSpy = mock(() => {})

    const TestComponentWithSpy = () => {
      renderSpy()
      const count = useStore(state => state.count)
      return <div data-testid='count'>{count}</div>
    }

    render(<TestComponentWithSpy />)

    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1)

    // Update name (should not trigger re-render)
    act(() => {
      useStore.setState({ name: 'updated' })
    })

    expect(renderSpy).toHaveBeenCalledTimes(1)

    // Update count (should trigger re-render)
    act(() => {
      useStore.setState({ count: 1 })
    })

    expect(renderSpy).toHaveBeenCalledTimes(2)
  })

  test('create should return a working hook', () => {
    const useAppStore = create(() => ({ count: 0, name: 'test' }))

    render(<TestCreateComponent useAppStore={useAppStore} />)

    expect(screen.getByTestId('count')).toHaveTextContent('0')
    expect(screen.getByTestId('name')).toHaveTextContent('test')
  })

  test('create hook should update state correctly', () => {
    const useAppStore = create(() => ({ count: 0, name: 'test' }))

    render(<TestCreateComponent useAppStore={useAppStore} />)

    const incrementButton = screen.getByTestId('increment')
    const updateNameButton = screen.getByTestId('update-name')

    act(() => {
      fireEvent.click(incrementButton)
    })

    expect(screen.getByTestId('count')).toHaveTextContent('1')

    act(() => {
      fireEvent.click(updateNameButton)
    })

    expect(screen.getByTestId('name')).toHaveTextContent('Updated Name')
  })

  test('create hook should work with selectors', () => {
    const useAppStore = create(() => ({ count: 10, name: 'test' }))

    render(<TestSelectorComponent useAppStore={useAppStore} />)

    expect(screen.getByTestId('count-only')).toHaveTextContent('10')
    expect(screen.getByTestId('name-only')).toHaveTextContent('test')

    const incrementButton = screen.getByTestId('increment-selector')

    act(() => {
      fireEvent.click(incrementButton)
    })

    expect(screen.getByTestId('count-only')).toHaveTextContent('11')
  })

  test('create hook should have access to store methods', () => {
    const useAppStore = create(() => ({ count: 0 }))

    expect(typeof useAppStore.setState).toBe('function')
    expect(typeof useAppStore.getState).toBe('function')
    expect(typeof useAppStore.getInitialState).toBe('function')
    expect(typeof useAppStore.subscribe).toBe('function')
  })

  test('create hook should maintain store methods functionality', () => {
    const useAppStore = create(() => ({ count: 0, name: 'test' }))

    // Test getState
    expect(useAppStore.getState()).toEqual({ count: 0, name: 'test' })

    // Test setState
    useAppStore.setState({ count: 5 })
    expect(useAppStore.getState().count).toBe(5)

    // Test getInitialState
    expect(useAppStore.getInitialState()).toEqual({ count: 0, name: 'test' })

    // Test subscribe
    const listener = mock(() => {})
    const unsubscribe = useAppStore.subscribe(listener)

    useAppStore.setState({ count: 10 })
    expect(listener).toHaveBeenCalledWith(
      { count: 10, name: 'test' },
      { count: 5, name: 'test' }
    )

    unsubscribe()
  })

  test('multiple components should share same store state', () => {
    const useAppStore = create(() => ({ count: 0 }))

    const Component1 = () => {
      const { count } = useAppStore()
      return <div data-testid='component1-count'>{count}</div>
    }

    const Component2 = () => {
      const { count } = useAppStore()
      return (
        <div>
          <div data-testid='component2-count'>{count}</div>
          <button
            data-testid='component2-increment'
            onClick={() => useAppStore.setState(state => ({ count: state.count + 1 }))}
          >
            Increment
          </button>
        </div>
      )
    }

    render(
      <div>
        <Component1 />
        <Component2 />
      </div>
    )

    expect(screen.getByTestId('component1-count')).toHaveTextContent('0')
    expect(screen.getByTestId('component2-count')).toHaveTextContent('0')

    act(() => {
      fireEvent.click(screen.getByTestId('component2-increment'))
    })

    expect(screen.getByTestId('component1-count')).toHaveTextContent('1')
    expect(screen.getByTestId('component2-count')).toHaveTextContent('1')
  })

  test('should handle function updates in setState', () => {
    const useAppStore = create(() => ({ items: [] }))

    const TestComponent = () => {
      const { items } = useAppStore()
      return (
        <div>
          <div data-testid='items-count'>{items.length}</div>
          <button
            data-testid='add-item'
            onClick={() => useAppStore.setState(state => ({
              items: [...state.items, `item-${state.items.length + 1}`]
            }))}
          >
            Add Item
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId('items-count')).toHaveTextContent('0')

    act(() => {
      fireEvent.click(screen.getByTestId('add-item'))
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('1')

    act(() => {
      fireEvent.click(screen.getByTestId('add-item'))
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('2')
  })

  test('should handle synchronous updates correctly', () => {
    const useAppStore = create(() => ({ count: 0 }))

    const TestComponent = () => {
      const { count } = useAppStore()
      return (
        <div>
          <div data-testid='count'>{count}</div>
          <button
            data-testid='multi-update'
            onClick={() => {
              useAppStore.setState({ count: 1 })
              useAppStore.setState({ count: 2 })
              useAppStore.setState({ count: 3 })
            }}
          >
            Multi Update
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId('count')).toHaveTextContent('0')

    act(() => {
      fireEvent.click(screen.getByTestId('multi-update'))
    })

    expect(screen.getByTestId('count')).toHaveTextContent('3')
  })

  test('should work with empty selector (returns full state)', () => {
    const useAppStore = create(() => ({ count: 5, name: 'test' }))

    const TestComponent = () => {
      const fullState = useAppStore()
      return <div data-testid='full-state'>{JSON.stringify(fullState)}</div>
    }

    render(<TestComponent />)

    expect(screen.getByTestId('full-state')).toHaveTextContent('{"count":5,"name":"test"}')
  })

})
