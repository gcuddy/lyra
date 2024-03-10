import { useDirectoryPath } from "@/atoms/paths";
import { useMainScrollRef } from "@/atoms/refs";
import TopBar from "@/components/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/globals.css";
import { keepPreviousData } from "@tanstack/query-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { Store } from "tauri-plugin-store-api";
import { Provider } from 'jotai/react'
import { useHydrateAtoms } from 'jotai/react/utils'
import { queryClientAtom } from "jotai-tanstack-query";
import { Providers } from "./providers";
const SourceList = dynamic(() => import("@/components/source-list"), {
	ssr: false,
});

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Infinity,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			refetchOnMount: false,
			placeholderData: keepPreviousData,
		}
	}
})

const HydrateAtoms = ({ children }: {
	children: React.ReactNode
}) => {
	useHydrateAtoms([[queryClientAtom, queryClient]])
	return children

}

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
	// could maybe move this logic into library component

	return (
		<QueryClientProvider client={queryClient}>
			<Provider>
				<HydrateAtoms>
					<Providers>
						<TooltipProvider>
							<main
								className={`flex select-none pointer-events-none min-h-screen overscroll-none  h-16 flex-col items-center justify-between bg-app/90 overflow-hidden ${inter.className}`}
							>
								<TopBar />
								<Wrapper>
									<div style={{}} className="flex flex-col">
										<SourceList />
									</div>
									<Component {...pageProps} />
								</Wrapper>
							</main>
						</TooltipProvider>
					</Providers>
				</HydrateAtoms>
			</Provider>
		</QueryClientProvider>
	);
}

export function Wrapper({ children }: { children: React.ReactNode }) {
	const [, setMainScrollRef] = useMainScrollRef();
	return (
		<div
			ref={setMainScrollRef}
			className="flex grow h-[calc(100%-80px)] w-full"
		>
			{children}
		</div>
	)
}
