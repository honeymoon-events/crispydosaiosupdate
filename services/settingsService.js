import firestore from '@react-native-firebase/firestore';

export const fetchAppSettings = async () => {
    try {
        const doc = await firestore().collection("settings").doc("global").get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error("Fetch App Settings Error:", error);
        return null;
    }
};
