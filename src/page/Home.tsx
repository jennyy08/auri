import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/customize")}
      className="relative flex h-full w-full flex-col items-center justify-center bg-auri-black px-8 text-left"
      aria-label="Enter auri"
    >
      <span className="font-display text-[64px] font-bold leading-none text-auri-blush">
        auri
      </span>
      <span className="absolute bottom-10 left-0 right-0 text-center text-[12px] tracking-wide text-white/50">
        sound &rarr; sensation
      </span>
    </button>
  );
}
