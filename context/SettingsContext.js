import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAppSettings } from "../services/settingsService";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        signup_bonus_amount: 0,
        referral_bonus_amount: 0,
        earn_per_order_amount: 0,
        minimum_order: 0,
        minimum_cart_total: 0,
    });

    const loadSettings = async () => {
        try {
            const res = await fetchAppSettings();
            if (res && res.status === 1) {
                setSettings(res.data);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loadSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
