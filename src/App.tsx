import { BrowserRouter, Routes, Route } from "react-router-dom";
import PhoneFrame from "./components/PhoneFrame";
import Home from "./page/Home";
import Customize from "./page/Customize";
import TargetSpaces from "./page/TargetSpaces";
import SoundSelection from "./page/SoundSelection";
import History from "./page/History";
import EmergencyContact from "./page/EmergencyContact";

export default function App() {
  return (
    <BrowserRouter>
      <PhoneFrame>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/customize/target-spaces" element={<TargetSpaces />} />
          <Route path="/customize/sound-selection" element={<SoundSelection />} />
          <Route path="/customize/history" element={<History />} />
          <Route path="/customize/emergency-contact" element={<EmergencyContact />} />
        </Routes>
      </PhoneFrame>
    </BrowserRouter>
  );
}