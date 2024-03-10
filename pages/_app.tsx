import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/globals.css";
import { keepPreviousData } from "@tanstack/query-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { Provider } from 'jotai/react'
import { useHydrateAtoms } from 'jotai/react/utils'
import { queryClientAtom } from "jotai-tanstack-query";
import { Providers } from "../components/providers";
import Layout from "@/components/layout";

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

export default function App({ Component, pageProps }: AppProps) {
	// could maybe move this logic into library component

	return (
		<QueryClientProvider client={queryClient}>
			<Provider>
				<HydrateAtoms>
					<Providers>
						<TooltipProvider>
							<Layout>
								<Component {...pageProps} />
							</Layout>
						</TooltipProvider>
					</Providers>
				</HydrateAtoms>
			</Provider>
		</QueryClientProvider>
	);
}
