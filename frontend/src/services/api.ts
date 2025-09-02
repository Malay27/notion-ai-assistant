import type { ApiResponse, CommandInterpretation } from "../types";

const BASE_URL = "http://localhost:8000"; // Adjust as necessary

export const interpretCommand = async (
  command: string
): Promise<ApiResponse<CommandInterpretation>> => {
  const response = await fetch(`${BASE_URL}/interpret`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
