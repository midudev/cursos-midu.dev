import "./index.css";
import { CounterDisplay, CounterControls, AnotherCounterDisplay, AnotherCounterControls, BottomRightCounterDisplay } from './components/Counter.jsx';

export function App() {
  return (
    <div className="max-w-xl mx-auto p-10">
      <header className="text-center mb-10">
        <h1>🚀 Demo Time</h1>
      </header>

      <section>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] pb-10">
          <CounterDisplay />
          <CounterControls />
        </div>
         
        <AnotherCounterDisplay />
        <AnotherCounterControls />
        <BottomRightCounterDisplay />
      </section>
    </div>
  );
}

export default App;
