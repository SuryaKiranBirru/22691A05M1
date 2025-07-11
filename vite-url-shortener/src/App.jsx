import React from "react";
import URLShortener from "./components/URLShortener";

export default function App() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial", textAlign: "center" }}>
      <h1>🔗 URL Shortener</h1>
      <URLShortener />
    </div>
  );
}
