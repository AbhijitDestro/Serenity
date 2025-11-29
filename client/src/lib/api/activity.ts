const API_BASE = "/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export interface ActivityData {
  type: "meditation" | "exercise" | "walking" | "reading" | "journaling" | "therapy" | "game" | "mood";
  name: string;
  description?: string;
  duration?: number;
  difficulty?: number;
  feedback?: string;
  moodScore?: number;
  moodNote?: string;
}

export const logActivity = async (data: ActivityData) => {
  try {
    const response = await fetch(`${API_BASE}/activity`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to log activity");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

export const getTodayActivities = async () => {
  try {
    const response = await fetch(`${API_BASE}/activity/today`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch activities");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
};

export const getActivityHistory = async () => {
  try {
    const response = await fetch(`${API_BASE}/activity/history`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch activity history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching activity history:", error);
    throw error;
  }
};