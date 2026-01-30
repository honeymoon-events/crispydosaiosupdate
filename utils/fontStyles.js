import { Dimensions } from 'react-native';

const { width } = Dimensions.get("window");
const scale = width / 400;

export const FONTS = {
  // Headings
  h1: {
    fontSize: 32 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "900",
    lineHeight: 40 * scale,
  },
  h2: {
    fontSize: 28 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "800",
    lineHeight: 36 * scale,
  },
  h3: {
    fontSize: 24 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 32 * scale,
  },
  h4: {
    fontSize: 22 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 28 * scale,
  },
  h5: {
    fontSize: 20 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 26 * scale,
  },
  h6: {
    fontSize: 18 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 24 * scale,
  },

  // Body
  body: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsMedium",
    fontWeight: "500",
    lineHeight: 24 * scale,
  },
  bodyBold: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 24 * scale,
  },
  bodySmall: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsMedium",
    fontWeight: "500",
    lineHeight: 20 * scale,
  },
  bodySmallBold: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 20 * scale,
  },

  // Labels
  label: {
    fontSize: 15 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "600",
    lineHeight: 20 * scale,
  },
  labelSmall: {
    fontSize: 13 * scale,
    fontFamily: "PoppinsMedium",
    fontWeight: "500",
    lineHeight: 18 * scale,
  },
  labelXSmall: {
    fontSize: 12 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    lineHeight: 16 * scale,
  },

  // Button text
  button: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    lineHeight: 20 * scale,
  },
  buttonSmall: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsSemiBold",
    fontWeight: "700",
    lineHeight: 18 * scale,
  },

  // Captions
  caption: {
    fontSize: 12 * scale,
    fontFamily: "PoppinsMedium",
    fontWeight: "500",
    lineHeight: 16 * scale,
  },
  captionBold: {
    fontSize: 12 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    lineHeight: 16 * scale,
  },
};

export default FONTS;
