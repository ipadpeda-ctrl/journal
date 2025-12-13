import Settings from "../Settings";

// todo: remove mock functionality
const defaultPairs = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD"];
const defaultEmotions = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const defaultConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const defaultConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];

export default function SettingsExample() {
  return (
    <Settings
      pairs={defaultPairs}
      emotions={defaultEmotions}
      confluencesPro={defaultConfluencesPro}
      confluencesContro={defaultConfluencesContro}
      onSave={(settings) => console.log("Settings saved:", settings)}
    />
  );
}
