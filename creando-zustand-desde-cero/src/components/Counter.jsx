import { useCounterStore } from '@/counter-store'

export const CounterDisplay = () => {
  const counter = useCounterStore(state => state.counter)

  return (
    <fieldset className="!flex justify-center items-center flex-col gap-y-2 relative">
      <span className="absolute opacity-40 left-2 top-2 font-mono text-xs">&lt;CounterDisplay /&gt;</span>
      <h3 className='!text-5xl !mb-0'>{counter}</h3>
    </fieldset>
  )
}

export const AnotherCounterDisplay = () => {
  const counter = useCounterStore(state => state.counter)

  return (
    <div className="fixed top-4 right-4 text-center">
      <fieldset className="!flex justify-center items-center flex-col gap-y-2 relative w-28 !pb-1 !pt-5">
        <span className="absolute opacity-40 left-2 top-2 font-mono text-[8px]">&lt;AnotherCounter /&gt;</span>
        <h3 className='!text-3xl !mb-0'>{counter}</h3>
      </fieldset>
    </div>
  )
}

export const BottomRightCounterDisplay = () => {
  const counter = useCounterStore(state => state.counter)

  return (
    <div className="fixed bottom-4 right-4 text-center">
      <fieldset className="!flex justify-center items-center flex-col gap-y-2 relative w-28 !pb-1 !pt-5">
        <span className="absolute opacity-40 top-2 left-2 font-mono text-[8px]">&lt;BottomCounter /&gt;</span>
        <h3 className='!text-3xl !mb-0'>{counter}</h3>
      </fieldset>
    </div>
  )
}

export const CounterControls = () => {
  // const { increment, decrement, reset } = useCounterStore()

  const increment = useCounterStore(state => state.increment)
  const decrement = useCounterStore(state => state.decrement)
  const reset = useCounterStore(state => state.reset)

  return (
    <fieldset className="!flex justify-center items-center flex-col gap-y-2 relative">
      <span className="absolute opacity-40 left-2 top-2 font-mono text-xs">&lt;CounterControls /&gt;</span>
      <div className='flex gap-x-2 pt-5'>
        <button onClick={increment}>➕ Increment</button>
        <button onClick={decrement}>➖ Decrement</button>
        <button onClick={reset}>🔄 Reset</button>
      </div>
    </fieldset>
  )
}

export const AnotherCounterControls = () => {
  const reset = useCounterStore(state => state.reset)

  return (
    <div className="fixed bottom-4 left-4 text-center">
      <fieldset className="!flex justify-center items-center flex-col gap-y-2 relative w-28 !pb-1 !pt-5">
        <span className="absolute opacity-40 left-2 top-2 font-mono text-[8px]">&lt;AnotherControls /&gt;</span>
        <div className='flex gap-x-2'>
          <button className="!text-xs !p-2" onClick={reset}>🔄 Reset</button>
        </div>
      </fieldset>
    </div>
  )
}
