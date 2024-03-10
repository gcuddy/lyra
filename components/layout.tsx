import { Inter } from "next/font/google";
import { useMainScrollRef } from "@/atoms/refs";
import TopBar from "@/components/top-bar";
// import SourceList from "@/components/source-list";
const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  const [, setMainScrollRef] = useMainScrollRef();
  return (
    <main
      className={`flex select-none pointer-events-none min-h-screen overscroll-none  h-16 flex-col items-center justify-between bg-app/90 overflow-hidden ${inter.className}`}
    >
      <TopBar />
      <div
        ref={setMainScrollRef}
        className="flex grow h-[calc(100%-80px)] w-full"
      >
        <div style={{}} className="flex flex-col">
          Sources here
          {/* <SourceList /> */}
        </div>
        {children}
      </div>
    </main>
  );
}
