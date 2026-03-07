import api from "../config/api";

export const fetchAppSettings = async () => {
    try {
        const response = await api.get("/app-settings");
        return response.data;
    } catch (error) {
        console.error("fetchAppSettings error:", error);
        return null;
    }
};
