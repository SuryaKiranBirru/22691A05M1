import axios from "axios";

const LOGGING_ENDPOINT = "http://20.244.56.144/evaluation-service/logs";

export const logEvent = async (stack, level, pkg, message, token) => {
  try {
    await axios.post(
      LOGGING_ENDPOINT,
      {
        stack,
        level,
        package: pkg,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("❌ Logging failed:", err?.response?.data || err.message);
  }
};
