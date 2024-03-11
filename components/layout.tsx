import { Inter } from "next/font/google";
import { useMainScrollRef } from "@/atoms/refs";
import TopBar from "@/components/top-bar";
import { useTheme } from "@/hooks/useTheme";
import { NoSSR } from "./no-ssr";
import { Sidebar } from "./sidebar";
const inter = Inter({ subsets: ["latin"] });


function Interface({
  children
}: {
  children: React.ReactNode;
}) {
  useTheme();
  return (
    children
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [, setMainScrollRef] = useMainScrollRef();
  return (
    <NoSSR>
      <Interface>
        <main
          className={`flex select-none pointer-events-none min-h-screen overscroll-none  h-16 flex-col items-center justify-between bg-app/90 overflow-hidden ${inter.className}`}
        >
          <TopBar />
          <div
            ref={setMainScrollRef}
            className="flex grow h-[calc(100%-80px)] w-full"
          >
            <Sidebar />
            {children}
          </div>

        </main>
      </Interface>
    </NoSSR>
  );
}
