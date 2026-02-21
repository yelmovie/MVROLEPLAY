import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/fonts.css";
import "./styles/tailwind.css";
import "./styles/theme.css";

createRoot(document.getElementById("root")!).render(<App />);
