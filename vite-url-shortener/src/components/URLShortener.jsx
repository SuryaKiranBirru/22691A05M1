import React, { useState } from "react";
import axios from "axios";
import { logEvent } from "../services/logService";

const SHORTEN_API = "https://api.shrtco.de/v2/shorten?url=";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMjY5MWEwNW0xQG1pdHMuYWMuaW4iLCJleHAiOjE3NTIyMTM4NzMsImlhdCI6MTc1MjIxMjk3MywiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjZhMjdkYjEzLTM1YzAtNDAxNy1hN2RiLWVmNDhkYTI5NmNiZiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImJpcnJ1IHN1cnlhIGtpcmFuIiwic3ViIjoiYzY3YWI3MmEtOTgwYy00OTc4LTg1Y2UtOTY2MjYwYjg1ZDRiIn0sImVtYWlsIjoiMjI2OTFhMDVtMUBtaXRzLmFjLmluIiwibmFtZSI6ImJpcnJ1IHN1cnlhIGtpcmFuIiwicm9sbE5vIjoiMjI2OTFhMDVtMSIsImFjY2Vzc0NvZGUiOiJjYVZ2TkgiLCJjbGllbnRJRCI6ImM2N2FiNzJhLTk4MGMtNDk3OC04NWNlLTk2NjI2MGI4NWQ0YiIsImNsaWVudFNlY3JldCI6ImNqcmdTQ2VZd3lmbkJlVXUifQ.rVPOiVNeYuCdjHeCiJ51JQSfKldzLVk7pwSh1Tv45oI"; // Replace this

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function URLShortener() {
  const [urls, setUrls] = useState([
    { url: "", validity: "", shortcode: "" }
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (idx, field, value) => {
    setUrls((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, { url: "", validity: "", shortcode: "" }]);
    }
  };

  const removeUrlField = (idx) => {
    setUrls(urls.filter((_, i) => i !== idx));
  };

  const handleShorten = async () => {
    // Client-side validation
    for (let i = 0; i < urls.length; i++) {
      const { url, validity } = urls[i];
      if (!url.trim()) {
        alert(`Please enter a URL for row ${i + 1}`);
        return;
      }
      if (!isValidUrl(url.trim())) {
        alert(`Invalid URL format at row ${i + 1}`);
        return;
      }
      if (validity && (!/^\d+$/.test(validity) || parseInt(validity) <= 0)) {
        alert(`Validity must be a positive integer at row ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    let newResults = [];
    for (let i = 0; i < urls.length; i++) {
      const { url, validity, shortcode } = urls[i];
      try {
        // API only supports url param, so we append shortcode/validity as comments in result
        const res = await axios.get(`${SHORTEN_API}${encodeURIComponent(url)}`);
        const result = res.data.result.short_link;
        await logEvent(
          "frontend",
          "info",
          "api",
          `Shortened URL successfully: ${result}`,
          BEARER_TOKEN
        );
        newResults.push({
          original: url,
          short: result,
          validity: validity || "-",
          shortcode: shortcode || "-"
        });
      } catch (error) {
        await logEvent(
          "frontend",
          "error",
          "api",
          `Failed to shorten URL: ${url}`,
          BEARER_TOKEN
        );
        newResults.push({
          original: url,
          short: "❌ Error",
          validity: validity || "-",
          shortcode: shortcode || "-"
        });
      }
    }
    setResults(newResults);
    setLoading(false);
  };

  return (
    <div>
      <h2>Shorten up to 5 URLs</h2>
      {urls.map((item, idx) => (
        <div key={idx} style={{ marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
          <input
            style={{ padding: "6px", width: "35%" }}
            type="text"
            placeholder="Original URL"
            value={item.url}
            onChange={e => handleInputChange(idx, "url", e.target.value)}
          />
          <input
            style={{ padding: "6px", width: "18%", marginLeft: 8 }}
            type="text"
            placeholder="Validity (min, optional)"
            value={item.validity}
            onChange={e => handleInputChange(idx, "validity", e.target.value)}
          />
          <input
            style={{ padding: "6px", width: "18%", marginLeft: 8 }}
            type="text"
            placeholder="Preferred shortcode (optional)"
            value={item.shortcode}
            onChange={e => handleInputChange(idx, "shortcode", e.target.value)}
          />
          {urls.length > 1 && (
            <button style={{ marginLeft: 8 }} onClick={() => removeUrlField(idx)}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addUrlField}
        disabled={urls.length >= 5}
        style={{ marginBottom: 16, marginRight: 8 }}
      >
        + Add URL
      </button>
      <button
        onClick={handleShorten}
        style={{ padding: "10px 20px" }}
        disabled={loading}
      >
        {loading ? "Shortening..." : "Shorten All"}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Shortened URLs</h3>
          <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: 6 }}>Original URL</th>
                <th style={{ border: "1px solid #ccc", padding: 6 }}>Shortened URL</th>
                <th style={{ border: "1px solid #ccc", padding: 6 }}>Validity (min)</th>
                <th style={{ border: "1px solid #ccc", padding: 6 }}>Shortcode</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #ccc", padding: 6 }}>{r.original}</td>
                  <td style={{ border: "1px solid #ccc", padding: 6 }}>
                    {r.short.startsWith("❌") ? (
                      r.short
                    ) : (
                      <a href={`https://${r.short}`} target="_blank" rel="noopener noreferrer">
                        {r.short}
                      </a>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 6 }}>{r.validity}</td>
                  <td style={{ border: "1px solid #ccc", padding: 6 }}>{r.shortcode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
