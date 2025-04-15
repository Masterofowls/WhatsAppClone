import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply custom CSS variables
document.documentElement.style.setProperty('--background', 'hsl(0 0% 100%)');
document.documentElement.style.setProperty('--foreground', 'hsl(222.2 47.4% 11.2%)');
document.documentElement.style.setProperty('--primary', 'hsl(142.1 76.2% 36.3%)'); // WhatsApp green
document.documentElement.style.setProperty('--primary-foreground', 'hsl(355.7 100% 97.3%)');
document.documentElement.style.setProperty('--secondary', 'hsl(217.2 91.2% 59.8%)'); // WhatsApp blue
document.documentElement.style.setProperty('--secondary-foreground', 'hsl(355.7 100% 97.3%)');
document.documentElement.style.setProperty('--muted', 'hsl(210 40% 96.1%)');
document.documentElement.style.setProperty('--muted-foreground', 'hsl(215.4 16.3% 56.9%)');
document.documentElement.style.setProperty('--accent', 'hsl(210 40% 96.1%)');
document.documentElement.style.setProperty('--accent-foreground', 'hsl(222.2 47.4% 11.2%)');
document.documentElement.style.setProperty('--destructive', 'hsl(0 84.2% 60.2%)');
document.documentElement.style.setProperty('--destructive-foreground', 'hsl(210 40% 98%)');
document.documentElement.style.setProperty('--border', 'hsl(214.3 31.8% 91.4%)');
document.documentElement.style.setProperty('--input', 'hsl(214.3 31.8% 91.4%)');
document.documentElement.style.setProperty('--ring', 'hsl(142.1 76.2% 36.3%)');
document.documentElement.style.setProperty('--radius', '0.375rem');

createRoot(document.getElementById("root")!).render(<App />);
