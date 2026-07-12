import { useState } from "react";
import "../styles/Components.css";

function ProductOptionDialog({ item, onCancel, onSave }) {
  const [note, setNote] = useState(item?.ProductOption || "");

  const quickNotes = [
    "No salt",
    "More salt",
    "No pepper",
    "More pepper",
    "Less oil",
    "Extra spicy",
    "No onion",
    "Take away",
  ];

  return (
    <div className="option-backdrop">
      <div className="option-dialog">
        <div className="option-header">
          <div>
            <h2>Product Option</h2>
            <p>{item?.ProductName}</p>
          </div>

          <button onClick={onCancel}>×</button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: no salt, more pepper..."
          autoFocus
        />

        <div className="quick-notes">
          {quickNotes.map((text) => (
            <button key={text} onClick={() => setNote(text)}>
              {text}
            </button>
          ))}
        </div>

        <div className="option-actions">
          <button className="cancel" onClick={onCancel}>
            Cancel
          </button>

          <button className="save" onClick={() => onSave(note)}>
            Save Option
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductOptionDialog;