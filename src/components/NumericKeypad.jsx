function NumericKeypad({ onKeyPress, onBackspace, onClear }) {
  const rows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m", "@", "."],
  ];

  return (
    <div className="touch-keyboard-wrapper">
      {rows.map((row, index) => (
        <div className={`keyboard-row row-${index + 1}`} key={index}>
          {row.map((key) => (
            <button className="ripple" key={key} onClick={() => onKeyPress(key)}>
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      ))}

      <div className="keyboard-row action-row">
        <button className="key-action ripple" onClick={onBackspace}>
          ⌫ Backspace
        </button>

        <button className="key-action clear ripple" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}

export default NumericKeypad;