// HelpCenter.jsx
import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Platform,
    Dimensions,
    StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";


const { width } = Dimensions.get("window");
const scale = width / 400;

export default function HelpCenter({ navigation }) {
    const insets = useSafeAreaInsets();
    const supportPhone = "+44 20 1234 5678"; // UK dummy phone number
    const supportEmail = "support@crispydosa.com";

    const handleCall = () => {
        Alert.alert(
            "Call Support",
            `Would you like to call ${supportPhone}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Call",
                    onPress: () => Linking.openURL(`tel:${supportPhone}`),
                },
            ]
        );
    };

    const handleEmail = () => {
        Linking.openURL(`mailto:${supportEmail}`);
    };

    const handleWhatsApp = () => {
        const whatsappNumber = "442012345678"; // UK number without + and spaces
        Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`);
    };

    const contactMethods = [
        {
            id: "phone",
            icon: "call",
            title: "Phone Support",
            subtitle: supportPhone,
            color: "#0b7a2a",
            bgColor: "#e8f5e9",
            onPress: handleCall,
        },
        {
            id: "email",
            icon: "mail",
            title: "Email Support",
            subtitle: supportEmail,
            color: "#1976d2",
            bgColor: "#e3f2fd",
            onPress: handleEmail,
        },
        {
            id: "whatsapp",
            icon: "logo-whatsapp",
            title: "WhatsApp",
            subtitle: "Chat with us",
            color: "#25D366",
            bgColor: "#e8f8f0",
            onPress: handleWhatsApp,
        },
    ];

    const faqCategories = [
        {
            title: "Orders & Delivery",
            icon: "fast-food",
            color: "#ff6b35",
            questions: [
                "How do I track my order?",
                "What are the delivery hours?",
                "Can I modify my order?",
            ],
        },
        {
            title: "Payments & Wallet",
            icon: "wallet",
            color: "#0b7a2a",
            questions: [
                "How do I add money to wallet?",
                "What payment methods are accepted?",
                "How do refunds work?",
            ],
        },
        {
            title: "Account & Profile",
            icon: "person",
            color: "#1976d2",
            questions: [
                "How do I update my profile?",
                "How do I change my password?",
                "Can I delete my account?",
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={28 * scale} color="#1C1C1C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


                {/* Contact Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    {contactMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={styles.contactCard}
                            onPress={method.onPress}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.contactIcon,
                                    { backgroundColor: method.bgColor },
                                ]}
                            >
                                <Ionicons
                                    name={method.icon}
                                    size={28}
                                    color={method.color}
                                />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitle}>{method.title}</Text>
                                <Text style={styles.contactSubtitle}>
                                    {method.subtitle}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#999" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick FAQ Categories */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Help</Text>
                    <TouchableOpacity
                        style={styles.faqButton}
                        onPress={() => navigation.navigate("FAQ")}
                        activeOpacity={0.7}
                    >
                        <View style={styles.faqButtonContent}>
                            <Ionicons name="help-circle" size={24} color="#ffffff" />
                            <Text style={styles.faqButtonText}>
                                View All FAQs
                            </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#ffffff" />
                    </TouchableOpacity>

                    {faqCategories.map((category, index) => (
                        <View key={index} style={styles.categoryCard}>
                            <View style={styles.categoryHeader}>
                                <View
                                    style={[
                                        styles.categoryIcon,
                                        { backgroundColor: `${category.color}20` },
                                    ]}
                                >
                                    <Ionicons
                                        name={category.icon}
                                        size={24}
                                        color={category.color}
                                    />
                                </View>
                                <Text style={styles.categoryTitle}>
                                    {category.title}
                                </Text>
                            </View>
                            {category.questions.map((question, qIndex) => (
                                <Text key={qIndex} style={styles.questionText}>
                                    • {question}
                                </Text>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Business Hours */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support Hours</Text>
                    <View style={styles.hoursCard}>
                        <View style={styles.hoursRow}>
                            <Ionicons name="time" size={24} color="#0b7a2a" />
                            <View style={styles.hoursInfo}>
                                <Text style={styles.hoursDay}>Monday - Friday</Text>
                                <Text style={styles.hoursTime}>9:00 AM - 10:00 PM</Text>
                            </View>
                        </View>
                        <View style={styles.hoursDivider} />
                        <View style={styles.hoursRow}>
                            <Ionicons name="time" size={24} color="#0b7a2a" />
                            <View style={styles.hoursInfo}>
                                <Text style={styles.hoursDay}>Saturday - Sunday</Text>
                                <Text style={styles.hoursTime}>10:00 AM - 8:00 PM</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: "#FFFFFF",
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    headerSpacer: {
        width: 44,
    },
    headerTitle: {
        fontSize: 20 * scale,
        fontWeight: "800",
        color: "#0f172a",
        fontFamily: "PoppinsBold",
    },
    content: {
        flex: 1,
    },

    section: {
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18 * scale,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 16,
        fontFamily: "PoppinsBold",
    },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: "#f8fafc",
    },
    contactIcon: {
        width: 52 * scale,
        height: 52 * scale,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 15 * scale,
        fontWeight: "800",
        color: "#0f172a",
        fontFamily: "PoppinsBold",
        marginBottom: 2,
    },
    contactSubtitle: {
        fontSize: 13 * scale,
        color: "#64748b",
        fontFamily: "PoppinsMedium",
    },
    faqButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#0b7a2a",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 6,
        shadowColor: "#0b7a2a",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    faqButtonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    faqButtonText: {
        fontSize: 16 * scale,
        fontWeight: "800",
        color: "#ffffff",
        marginLeft: 12,
        fontFamily: "PoppinsBold",
    },
    categoryCard: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderLeftWidth: 5,
        borderLeftColor: "#0b7a2a",
    },
    categoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    categoryIcon: {
        width: 40 * scale,
        height: 40 * scale,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    categoryTitle: {
        fontSize: 16 * scale,
        fontWeight: "800",
        color: "#1e293b",
        fontFamily: "PoppinsBold",
    },
    questionText: {
        fontSize: 13 * scale,
        color: "#475569",
        marginBottom: 8,
        marginLeft: 4,
        fontFamily: "PoppinsMedium",
    },
    hoursCard: {
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: "#f8fafc",
    },
    hoursRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    hoursInfo: {
        marginLeft: 18,
    },
    hoursDay: {
        fontSize: 16 * scale,
        fontWeight: "800",
        color: "#0f172a",
        fontFamily: "PoppinsBold",
        marginBottom: 4,
    },
    hoursTime: {
        fontSize: 14 * scale,
        color: "#64748b",
        fontFamily: "PoppinsMedium",
    },
    hoursDivider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginVertical: 20,
    },
});
