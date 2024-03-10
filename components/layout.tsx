import { Inter } from "next/font/google";
import { useMainScrollRef } from "@/atoms/refs";
import TopBar from "@/components/top-bar";
import NavLink from "./sidebar/link";
import { MusicNotes } from "@phosphor-icons/react";
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
        {/* TODO: width should be changeable   */}
        <div style={{}} className="flex flex-col justify-between bg-sidebar w-64 pt-5 min-h-full relative gap-2.5 border-r border-sidebar-divider px-2.5 pb-2">

          <ul className="grow flex flex-col pointer-events-auto">
            <li>
              <NavLink href="/">
                <div className="flex items-center">
                  <MusicNotes
                    weight="fill"
                    className="mr-2 h-4 w-4 shrink-0 fill-accent"
                  />
                  <span className="truncate">Library</span>
                </div>
              </NavLink>
            </li>
          </ul>
          Sources here
          {/* <SourceList /> */}
        </div>
        {children}
      </div>
    </main>
  );
}
