import React from "react";
import "./PixelButton.css";

export default function PixelButton({ text, onClick, className = "" }) {
  return (
    <button className={`pixel-button ${className}`.trim()} onClick={onClick}>
      {text}
    </button>
  );
}
