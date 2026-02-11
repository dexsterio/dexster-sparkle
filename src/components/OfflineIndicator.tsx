import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShow(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setTimeout(() => setShow(false), 2000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-500 ${
        isOffline
          ? "bg-destructive text-destructive-foreground opacity-100 translate-y-0"
          : "bg-green-600 text-white opacity-90 translate-y-0"
      }`}
      style={{ paddingTop: `max(0.5rem, env(safe-area-inset-top))` }}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          Du är offline — meddelanden synkas när du är online igen
        </>
      ) : (
        "Anslutning återupprättad"
      )}
    </div>
  );
};

export default OfflineIndicator;
