import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

const updateSW = registerSW({
  onNeedRefresh() {
    toast("Ny version tillgänglig", {
      description: "Uppdatera för att få senaste versionen.",
      duration: Infinity,
      action: {
        label: "Uppdatera",
        onClick: () => updateSW(true),
      },
    });
  },
  onOfflineReady() {
    toast.success("Appen är redo för offline-användning");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
