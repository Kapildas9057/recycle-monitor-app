import tamilTexts from "@/locales/employee/tamil.json";

export const useTamilText = () => {
  return (key: keyof typeof tamilTexts): string => {
    return tamilTexts[key] || key;
  };
};
