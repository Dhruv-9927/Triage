import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select 
      value={i18n.language.split('-')[0]} 
      onChange={handleLangChange}
      className="bg-white border border-[#E8E2D8] text-[#5E574E] text-xs font-semibold rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-[#4A2E1B] focus:border-[#4A2E1B] outline-none shadow-warm-sm transition cursor-pointer"
    >
      <option value="en">English (EN)</option>
      <option value="hi">हिंदी (HI)</option>
    </select>
  );
}
