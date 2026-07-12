import { useState } from "react";

function NumericKeypad({ onKeyPress, onBackspace, onClear }) {
  const [mode, setMode] = useState("letters");

  const letters = [
    "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
    "a", "s", "d", "f", "g", "h", "j", "k", "l",
    "z", "x", "c", "v", "b", "n", "m",
  ];

  const numbers = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "0", "@", "#",
    "-", "_", ".",
  ];

  const keys = mode === "letters" ? letters : numbers;

  return (
    <>
      <div className="keyboard-mode">
        <button
          className={mode === "letters" ? "active" : ""}
          onClick={() => setMode("letters")}
        >
          ABC
        </button>

        <button
          className={mode === "numbers" ? "active" : ""}
          onClick={() => setMode("numbers")}
        >
          123
        </button>
      </div>

      <div className="touch-keyboard">
        {keys.map((key) => (
          <button className="ripple" key={key} onClick={() => onKeyPress(key)}>
            {key.toUpperCase()}
          </button>
        ))}

        <button className="key-action ripple" onClick={onBackspace}>
          ⌫
        </button>

        <button className="key-action clear ripple" onClick={onClear}>
          Clear
        </button>
      </div>
    </>
  );
}

export default NumericKeypad;